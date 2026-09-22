/**
 * WebGPU 的 uniform 实现。
 *
 * 与 GL 侧的差异（保留，不做抹平）：
 *  - WebGPU 没有"游离 uniform"这个概念：值只能待在 uniform buffer 里。本对象
 *    因此退化成"块内的一段字节区间"，location 返回的是块内字节偏移，
 *    而不是任何原生 location —— WebGPU 根本不存在 location。
 *  - 赋值不产生原生调用：打包后的值直接写进所属块的 staging 镜像，并把该区间
 *    标脏，由块的 flush() 经 queue.writeBuffer 一次性提交。GL 侧则是把赋值
 *    推迟到 flush() 里的 uniform*fv。
 *  - 冗余赋值同样会被跳过（packedEquals 逐分量比较），只是省下的是 CPU 侧拷贝，
 *    而不是一次 JS→原生调用。
 *
 * 与 GL 侧相同的一点：uniform 对象由所属块创建并持有，随块一起销毁。
 */
import {
  packUniformValue,
  packedEquals,
  type PackedValue,
  type Std140MemberLayout,
  type UniformValue,
} from '../../core/data.js';
import type { Device } from '../../core/device.js';
import { invalidDescriptor } from '../../core/errors.js';
import { Uniform, type UniformDescriptor } from '../../core/uniform.js';
import type { GPUUniformBlock } from './gpuUniformBlock.js';

export class GPUUniform extends Uniform {
  private readonly device: Device;
  private readonly block: GPUUniformBlock;
  /** 在块布局中的成员记录：位移、占用字节、数组步长都由它给出 */
  private readonly layout: Std140MemberLayout;
  /** 块内字节偏移（WebGPU 意义上的"location"） */
  private readonly byteOffset: number;
  /** 该 uniform 占用的字节数（数组为整个数组） */
  private readonly byteLength: number;

  /** 上一次写进 staging 的打包值；null 表示尚未设置过 */
  private current: PackedValue | null = null;

  constructor(device: Device, descriptor: UniformDescriptor, offset: number, block: GPUUniformBlock) {
    super(device, descriptor);
    const layout = block.member(descriptor.name);
    if (!layout) {
      throw invalidDescriptor(`${descriptor.name}: 所属块 ${block.name} 的布局中没有同名成员`, {
        hint: 'WebGPU 下 uniform 必须属于某个块；loose uniform 会被管线合成为 $uniforms 块。',
      });
    }
    this.device = device;
    this.block = block;
    this.layout = layout;
    this.byteOffset = offset;
    this.byteLength = layout.byteSize;
  }

  /** 块内字节偏移。WebGPU 没有 uniform location，这里退化为偏移量。 */
  override get location(): number {
    return this.byteOffset;
  }

  /** 所在区间是否还有未提交到 UBO 的改动。 */
  override get dirty(): boolean {
    const range = this.block.buffer?.dirtyRange;
    if (!range) return false;
    return range.offset < this.byteOffset + this.byteLength && this.byteOffset < range.offset + range.byteLength;
  }

  override get value(): PackedValue | undefined {
    return this.current ?? undefined;
  }

  override set(value: UniformValue): void {
    this.assertAlive('set');
    const packed = packUniformValue(this.type, value, this.count, `uniform ${this.name}`);
    if (packedEquals(this.current ?? undefined, packed)) {
      this.recordSkip();
      return;
    }
    const buffer = this.block.buffer;
    if (!buffer) {
      throw invalidDescriptor(`${this.describe()}: 所属块 ${this.block.name} 没有真实 uniform buffer`, {
        hint: 'WebGPU 的 uniform 块不降级，block.buffer 不应为 null。',
      });
    }
    // 写进块的 staging 镜像并按 std140 偏移标脏；真正的上传由块 flush() 完成
    buffer.writer().writeMember(this.layout, packed);
    buffer.markDirty(this.byteOffset, this.byteLength);
    this.current = packed;
  }

  /**
   * 强制下次提交时重新上传本 uniform 的区间。
   * staging 里已经存着上一次的值，因此只需重新标脏，不必再写一遍数据。
   */
  override markDirty(): void {
    this.assertAlive('markDirty');
    if (!this.current) return;
    this.block.buffer?.markDirty(this.byteOffset, this.byteLength);
  }

  protected override onDestroy(): void {
    this.current = null;
  }

  /** 值未变化：省下一次 staging 拷贝，并计入 uniform 跳过计数。 */
  private recordSkip(): void {
    const stats = this.device.stats;
    stats.uniformSkips++;
    stats.nativeCallsSkipped++;
    stats.skippedByName.set('uniform', (stats.skippedByName.get('uniform') ?? 0) + 1);
  }
}
