/**
 * WebGPU 的缓冲实现（VBO / EBO / UBO / SSBO 共用一份实现）。
 *
 * 与 GL 侧的差异（保留，不做抹平）：
 *  - 没有 binding target。用途由 GPUBufferUsage 位掩码在创建时一次性决定，
 *    因此这里不再有 ARRAY_BUFFER / UNIFORM_BUFFER 那套绑定点概念。
 *  - 更新数据只有一条路径：queue.writeBuffer。它是"隐式拷贝到队列"，因此
 *    COPY_DST 由库强制加入（见 format.ts 的 gpuBufferUsage）。
 *  - 没有 orphaning。Stream 频率在 WebGPU 下的语义退化为"整块重写"，
 *    因为 writeBuffer 本身就不会让 GPU 等待旧数据用完。
 *  - 多了 mappedAtCreation：创建时直接把显存映射给 CPU，省掉一次 writeBuffer。
 *
 * 更新策略与 GL 侧保持一致：frequency 决定整块还是局部，
 * 并且 update() 与 writer()+markDirty()+flush() 共用同一份 staging 镜像。
 */
import { Buffer, type BufferDescriptor, type BufferRange, type BufferUpdateOptions } from '../../core/buffer.js';
import { DataWriter, packUniformValue, type UniformValue } from '../../core/data.js';
import type { Device } from '../../core/device.js';
import { ErrorCode, GraphicsError, invalidDescriptor } from '../../core/errors.js';
import type { ShaderDataType } from '../../core/types.js';
import { gpuBufferUsage } from './format.js';

/**
 * 原生缓冲句柄的类型。
 *
 * 不能直接写 `GPUBuffer`：本文件导出的类也叫 GPUBuffer，会遮蔽 @webgpu/types
 * 的全局类型，导致成员类型解析回本类。这里从 createBuffer 的返回值取类型，
 * 既避免遮蔽，也跟随 @webgpu/types 的版本变化。
 */
type NativeBuffer = ReturnType<GPUDevice['createBuffer']>;

export class GPUBuffer extends Buffer {
  private readonly device: Device;
  private readonly gpuDevice: GPUDevice;
  private readonly nativeBuffer: NativeBuffer;

  /** CPU 侧镜像，仅在 writer() / markDirty() 被使用时才分配 */
  private staging: DataWriter | null = null;
  private dirtyStart = 0;
  private dirtyEnd = 0;
  private destroyed = false;

  constructor(device: Device, descriptor: BufferDescriptor, gpuDevice: GPUDevice) {
    super(device, descriptor, 'buffer');
    this.device = device;
    this.gpuDevice = gpuDevice;

    const usage = gpuBufferUsage(this.usage);
    const mapped = descriptor.mappedAtCreation === true && descriptor.data !== undefined;
    this.nativeBuffer = gpuDevice.createBuffer({
      label: this.label,
      size: this.size,
      usage,
      mappedAtCreation: mapped,
    });
    device.commands.record('gpu', 'createBuffer', [this.label, this.size]);

    if (descriptor.data) {
      if (mapped) {
        writeMapped(this.nativeBuffer, 0, descriptor.data, this.size, this.describe());
        this.nativeBuffer.unmap();
      } else {
        this.writeNative(0, descriptor.data);
      }
    }
  }

  override get native(): NativeBuffer {
    return this.nativeBuffer;
  }

  /** 与 native 同义，便于按后端命名下探。 */
  get gpuBuffer(): NativeBuffer {
    return this.nativeBuffer;
  }

  override update(data: ArrayBufferView | ArrayBuffer, options: BufferUpdateOptions = {}): void {
    this.assertAlive('update');
    const offset = options.offset ?? 0;
    const bytes = data instanceof ArrayBuffer ? data.byteLength : data.byteLength;
    this.assertRange(offset, bytes, 'update');
    this.assertAligned(bytes, 'update');

    if (this.staging) copyInto(this.staging, offset, data);
    this.writeNative(offset, data);
  }

  override updateValue(type: ShaderDataType, values: UniformValue, offset: number): void {
    this.assertAlive('updateValue');
    const packed = packUniformValue(type, values, 1, `buffer#${this.id}.updateValue`);
    this.assertRange(offset, packed.byteLength, 'updateValue');
    if (this.staging) copyInto(this.staging, offset, packed);
    this.writeNative(offset, packed);
  }

  override writer(): DataWriter {
    this.assertAlive('writer');
    if (!this.staging) this.staging = new DataWriter(this.size);
    return this.staging;
  }

  override markDirty(offset: number, byteLength: number): void {
    this.assertAlive('markDirty');
    if (byteLength <= 0) return;
    if (!this.staging) this.staging = new DataWriter(this.size);
    this.assertRange(offset, byteLength, 'markDirty');
    this.mergeDirty(offset, offset + byteLength);
  }

  override get dirtyRange(): BufferRange | null {
    if (this.dirtyEnd <= this.dirtyStart) return null;
    return { offset: this.dirtyStart, byteLength: this.dirtyEnd - this.dirtyStart };
  }

  override flush(): void {
    this.assertAlive('flush');
    const range = this.dirtyRange;
    if (!range || !this.staging) return;
    const aligned = alignRange(range.offset, range.byteLength, this.size);
    const view = new Uint8Array(this.staging.buffer, aligned.offset, aligned.byteLength);
    this.writeNative(aligned.offset, view);
    this.dirtyStart = 0;
    this.dirtyEnd = 0;
  }

  override replace(data: ArrayBufferView | ArrayBuffer): void {
    this.assertAlive('replace');
    const bytes = data instanceof ArrayBuffer ? data.byteLength : data.byteLength;
    if (bytes !== this.size) {
      throw invalidDescriptor(
        `${this.describe()}: replace 需要 ${this.size} 字节，实际收到 ${bytes} 字节`,
        { hint: '整块替换要求大小一致；大小会变请销毁后重建缓冲。' },
      );
    }
    if (this.staging) copyInto(this.staging, 0, data);
    this.dirtyStart = 0;
    this.dirtyEnd = 0;
    this.writeNative(0, data);
  }

  protected override onDestroy(): void {
    this.staging = null;
    if (this.destroyed) return;
    this.destroyed = true;
    this.device.commands.record('gpu', 'destroyBuffer', [this.label]);
    this.nativeBuffer.destroy();
  }

  // -------------------------------------------------------------------------

  /** 所有上传都汇聚到这里，便于统一记录统计与统一校验。 */
  private writeNative(offset: number, data: ArrayBufferView | ArrayBuffer): void {
    if (this.destroyed) {
      throw new GraphicsError(`${this.describe()}: 原生缓冲已释放，无法写入`, {
        code: ErrorCode.ResourceDisposed,
        api: this.owner.api,
        resource: this.describe(),
      });
    }
    const bytes = data instanceof ArrayBuffer ? data.byteLength : data.byteLength;
    if (bytes === 0) return;
    this.assertAligned(bytes, 'writeBuffer');
    // WebGPU 的 writeBuffer 是队列操作：立即返回，由驱动在提交时完成拷贝
    this.gpuDevice.queue.writeBuffer(this.nativeBuffer, offset, data as BufferSource);
    this.device.commands.record('gpu', 'writeBuffer', [this.label, offset, bytes]);
    this.device.stats.bufferUploads++;
    this.device.stats.bufferUploadBytes += bytes;
  }

  private mergeDirty(start: number, end: number): void {
    if (this.dirtyEnd <= this.dirtyStart) {
      this.dirtyStart = start;
      this.dirtyEnd = end;
      return;
    }
    if (start < this.dirtyStart) this.dirtyStart = start;
    if (end > this.dirtyEnd) this.dirtyEnd = end;
  }

  private assertRange(offset: number, byteLength: number, call: string): void {
    if (offset < 0 || byteLength < 0 || offset + byteLength > this.size) {
      throw invalidDescriptor(
        `${this.describe()}.${call}: 区间 [${offset}, ${offset + byteLength}) 越界，缓冲共 ${this.size} 字节`,
      );
    }
  }

  /** WebGPU 要求 writeBuffer 的 size 与 dataOffset 对齐到 4 字节。 */
  private assertAligned(byteLength: number, call: string): void {
    if (byteLength % 4 !== 0) {
      throw invalidDescriptor(
        `${this.describe()}.${call}: 写入 ${byteLength} 字节，不是 4 的倍数`,
        { hint: 'WebGPU 的 queue.writeBuffer 要求 size 是 4 的倍数；请补齐尾部填充。' },
      );
    }
  }
}

/** 把脏区间扩到 4 字节边界（writeBuffer 的硬要求），并夹在缓冲范围内。 */
function alignRange(offset: number, byteLength: number, size: number): { offset: number; byteLength: number } {
  const start = Math.floor(offset / 4) * 4;
  const end = Math.min(size, Math.ceil((offset + byteLength) / 4) * 4);
  return { offset: start, byteLength: end - start };
}

function copyInto(writer: DataWriter, offset: number, data: ArrayBufferView | ArrayBuffer): void {
  const bytes =
    data instanceof ArrayBuffer
      ? new Uint8Array(data)
      : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  new Uint8Array(writer.buffer, offset, bytes.byteLength).set(bytes);
}

/** mappedAtCreation 路径：不经过队列，直接写映射内存。 */
function writeMapped(
  buffer: NativeBuffer,
  offset: number,
  data: ArrayBufferView | ArrayBuffer,
  size: number,
  label: string,
): void {
  const bytes =
    data instanceof ArrayBuffer
      ? new Uint8Array(data)
      : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  if (offset + bytes.byteLength > size) {
    throw invalidDescriptor(`${label}: 初始数据 ${bytes.byteLength} 字节超出缓冲大小 ${size}`);
  }
  new Uint8Array(buffer.getMappedRange(), offset, bytes.byteLength).set(bytes);
}
