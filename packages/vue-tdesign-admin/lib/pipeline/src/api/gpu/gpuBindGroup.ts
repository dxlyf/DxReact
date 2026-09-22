/**
 * WebGPU 的绑定组实现。
 *
 * 与 GL 侧的差异（保留，不做抹平）：
 *  - GL 没有原生绑定组，`native` 恒为 null，退化为「名字 -> 槽位」映射；
 *    WebGPU 的 GPUBindGroup 是真实存在的原生对象，因此本类的 native 返回它，
 *    并在任何 setBuffer / setTexture / setUniform 之后按需重建（dirty）。
 *  - binding 序号不是固定的纹理单元，而是由管线布局显式分配（layout.bindingOf），
 *    uniform 块与纹理共用同一套序号；纹理在需要时还会额外占用一个相邻序号给 sampler
 *    （见 usesSeparateSampler），所以一次 setTexture 可能产生两个 entry。
 *  - GL 的采样状态写在纹理上，WebGPU 的 sampler 是独立对象：纹理 entry 之后紧跟
 *    一个 sampler entry，采样器取显式传入的，否则用 texture.sampler。
 *  - 没有「游离 uniform」的绑定路径：uniform 值统一写进某个块的绑定缓冲，
 *    因此 setUniform 只接受 `Block.member` 形式，按 std140 成员偏移直接写入缓冲
 *    （不依赖 GPUUniformBlock）。
 *  - GPUBindGroupLayout 不由 BindGroupDescriptor 提供，而是管线在设备侧注册；
 *    这里通过 device 上的 bindGroupLayoutFor() 取回，取不到说明管线还没创建。
 *
 * 注意：本文件导出的类名 GPUBindGroup 会遮蔽 @webgpu/types 的全局同名类型，
 * 因此原生句柄类型统一用 ReturnType<GPUDevice['createBindGroup']> 表达。
 */
import {
  BindGroup,
  type BindGroupDescriptor,
  type BindGroupEntry,
} from '../../core/bindGroup.js';
import type { Buffer } from '../../core/buffer.js';
import type { UniformValue } from '../../core/data.js';
import type { Device } from '../../core/device.js';
import { invalidDescriptor, typeMismatch, unsupported } from '../../core/errors.js';
import { usesSeparateSampler, type PipelineBlockLayout, type PipelineLayoutView } from '../../core/pipeline.js';
import type { Sampler, Texture } from '../../core/texture.js';
import { GPUBuffer } from './gpuBuffer.js';
import { GPUSampler, GPUTexture } from './gpuTexture.js';

/** 原生绑定组句柄（全局 GPUBindGroup，绕开本文件同名类的遮蔽）。 */
type NativeBindGroup = ReturnType<GPUDevice['createBindGroup']>;
/** 原生缓冲句柄（全局 GPUBuffer，绕开 gpuBuffer.ts 同名类的遮蔽）。 */
type NativeBuffer = ReturnType<GPUDevice['createBuffer']>;
/** 原生采样器句柄（全局 GPUSampler，绕开 gpuTexture.ts 同名类的遮蔽）。 */
type NativeSampler = ReturnType<GPUDevice['createSampler']>;

/**
 * 设备侧的布局缓存接口。
 * GPUGraphicsDevice 会实现 bindGroupLayoutFor()，把管线注册过的布局映射成
 * 一组 GPUBindGroupLayout（下标即 group 索引）。
 */
interface BindGroupLayoutProvider {
  bindGroupLayoutFor?(layout: PipelineLayoutView): readonly GPUBindGroupLayout[];
}

/** 一个 uniform 块 / 缓冲绑定的当前状态。 */
interface BufferSlot {
  buffer: GPUBuffer;
  /** 缓冲内起始字节偏移（4 的倍数） */
  offset: number;
  /** 绑定区间字节长度；省略表示绑定到缓冲末尾 */
  size?: number;
}

/** 一个纹理绑定的当前状态。 */
interface TextureSlot {
  texture: GPUTexture | null;
  sampler: GPUSampler | null;
  /** 该声明在 WebGPU 下是否需要额外的 sampler entry */
  separateSampler: boolean;
}

export class GPUBindGroup extends BindGroup {
  /** 只读布局视图，供后续 gpuDevice.ts 复用（例如反查绑定名 / 校验布局）。 */
  readonly layoutView: PipelineLayoutView;

  private readonly device: Device;
  private readonly gpuDevice: GPUDevice;
  /** 本组对应的原生布局（已按 group 索引挑好） */
  private readonly gpuLayout: GPUBindGroupLayout;
  private readonly bufferSlots = new Map<string, BufferSlot>();
  private readonly textureSlots = new Map<string, TextureSlot>();

  private nativeGroup: NativeBindGroup | null = null;
  private pending = true;

  constructor(device: Device, descriptor: BindGroupDescriptor, gpuDevice: GPUDevice) {
    super(device, descriptor);
    this.device = device;
    this.gpuDevice = gpuDevice;

    const layoutView = descriptor.pipeline;
    if (!layoutView) {
      throw invalidDescriptor(
        `${this.label}: WebGPU 的绑定组需要 descriptor.pipeline 才能解析 binding 序号`,
        { hint: '推荐用 pipeline.createBindGroup({ Globals: { buffer: ubo }, uTexture: { texture: tex } })。' },
      );
    }
    this.layoutView = layoutView;

    // group 索引沿用基类解析结果（descriptor.group ?? 默认组 0），
    // 布局对象由管线在设备侧注册，只能从 device 上取回。
    const layouts = (device as unknown as BindGroupLayoutProvider).bindGroupLayoutFor?.(this.layoutView);
    if (!layouts) {
      throw unsupported(`${this.label}: 找不到布局对应的 GPUBindGroupLayout`, {
        hint: '请先创建管线（管线会为其布局注册 bind group layout）。',
      });
    }
    const gpuLayout = layouts[this.group];
    if (!gpuLayout) {
      throw invalidDescriptor(
        `${this.label}: 布局没有 bind group ${this.group}（共 ${layouts.length} 个）`,
        { hint: '请检查 PipelineDescriptor 里块 / 纹理声明上的 group 字段。' },
      );
    }
    this.gpuLayout = gpuLayout;

    for (const [name, entry] of Object.entries(descriptor.entries ?? {})) {
      this.applyEntry(name, entry);
    }
  }

  override get native(): NativeBindGroup {
    this.assertAlive('native');
    if (!this.nativeGroup || this.pending) {
      this.nativeGroup = this.buildNative();
      this.pending = false;
    }
    return this.nativeGroup;
  }

  /** 有待提交的改动：绑定变化，或绑定的缓冲还有未上传的脏区间。 */
  override get dirty(): boolean {
    if (this.pending) return true;
    for (const slot of this.bufferSlots.values()) {
      if (slot.buffer.dirtyRange) return true;
    }
    return false;
  }

  override setBuffer(name: string, buffer: Buffer | null, options: { offset?: number; size?: number } = {}): void {
    this.assertAlive('setBuffer');
    const block = this.layoutView.blocks.get(name);
    if (!block) {
      if (this.layoutView.textures.has(name)) {
        throw invalidDescriptor(`${this.label}: ${name} 是纹理，不能用 setBuffer 绑定缓冲`, {
          hint: `请用 setTexture('${name}', texture)。`,
        });
      }
      throw invalidDescriptor(`${this.label}: 未声明名为 ${name} 的 uniform 块`, { hint: this.availableHint() });
    }
    if (buffer === null) {
      this.bufferSlots.delete(name);
      this.pending = true;
      return;
    }
    if (!(buffer instanceof GPUBuffer)) {
      throw typeMismatch(`${this.label}: ${name} 需要 WebGPU 后端创建的缓冲`, {
        hint: '用 device.createBuffer() 创建。',
      });
    }

    const offset = options.offset ?? 0;
    if (!Number.isInteger(offset) || offset < 0 || offset % 4 !== 0) {
      throw invalidDescriptor(`${this.label}: ${name} 的 offset(${offset}) 必须是非负且为 4 的倍数的整数`, {
        hint: 'WebGPU 要求 buffer binding 的 offset 对齐到 4 字节。',
      });
    }
    const remaining = buffer.size - offset;
    if (remaining <= 0) {
      throw invalidDescriptor(`${this.label}: ${name} 的 offset(${offset}) 超出缓冲大小 ${buffer.size}`);
    }

    let size = options.size;
    if (size === undefined) {
      // 块有 std140 布局且声明的 size 小于缓冲剩余长度时，只绑定布局声明的那一段
      if (block.layout.size < remaining) size = block.layout.size;
    } else if (!Number.isInteger(size) || size <= 0 || size % 4 !== 0) {
      throw invalidDescriptor(`${this.label}: ${name} 的 size(${size}) 必须是正且为 4 的倍数的整数`, {
        hint: 'WebGPU 要求 buffer binding 的 size 对齐到 4 字节。',
      });
    }
    if (size !== undefined && size > remaining) {
      throw invalidDescriptor(
        `${this.label}: ${name} 的区间 [${offset}, ${offset + size}) 超出缓冲大小 ${buffer.size}`,
      );
    }

    this.bufferSlots.set(name, { buffer, offset, size });
    this.pending = true;
  }

  override setTexture(name: string, texture: Texture | null, sampler: Sampler | null = null): void {
    this.assertAlive('setTexture');
    const declaration = this.layoutView.textures.get(name);
    if (!declaration) {
      if (this.layoutView.blocks.has(name)) {
        throw invalidDescriptor(`${this.label}: ${name} 是 uniform 块，不能用 setTexture 绑定纹理`, {
          hint: `请用 setBuffer('${name}', ubo) 或 setUniform('${name}.成员名', value)。`,
        });
      }
      throw invalidDescriptor(`${this.label}: 未声明名为 ${name} 的纹理`, { hint: this.availableHint() });
    }
    if (texture !== null && !(texture instanceof GPUTexture)) {
      throw typeMismatch(`${this.label}: ${name} 需要 WebGPU 后端创建的纹理`, {
        hint: '用 device.createTexture() 创建。',
      });
    }
    if (sampler !== null && !(sampler instanceof GPUSampler)) {
      throw typeMismatch(`${this.label}: ${name} 需要 WebGPU 后端创建的采样器`, {
        hint: '采样器由 texture.sampler 提供，或用 device.createSampler() 创建。',
      });
    }
    this.textureSlots.set(name, { texture, sampler, separateSampler: usesSeparateSampler(declaration.kind) });
    this.pending = true;
  }

  /**
   * 写入 uniform 值。名字必须是 `Block.member` 形式（块的成员），
   * 值按 std140 成员偏移直接写进该块绑定的缓冲；游离 uniform 请写 `$uniforms.member`。
   */
  override setUniform(name: string, value: UniformValue): void {
    this.assertAlive('setUniform');
    const dot = name.indexOf('.');
    if (dot > 0) {
      const blockName = name.slice(0, dot);
      const block = this.layoutView.blocks.get(blockName);
      if (!block) {
        throw invalidDescriptor(`${this.label}: 未声明名为 ${blockName} 的 uniform 块`, { hint: this.availableHint() });
      }
      this.writeBlockMember(blockName, block, name.slice(dot + 1), value);
      return;
    }
    if (this.layoutView.blocks.has(name)) {
      throw invalidDescriptor(`${this.label}: ${name} 是 uniform 块，不能整体赋值`, {
        hint: `请写成 ${name}.成员名，并先用 setBuffer('${name}', ubo) 绑定缓冲。`,
      });
    }
    if (this.layoutView.textures.has(name)) {
      throw invalidDescriptor(`${this.label}: ${name} 是纹理，不能用 setUniform 赋值`, {
        hint: `请用 setTexture('${name}', texture, sampler)。`,
      });
    }
    throw invalidDescriptor(`${this.label}: 未知的 uniform 名 ${name}`, {
      hint: `${this.availableHint()}（uniform 值统一写成「块名.成员名」）`,
    });
  }

  override setUniforms(values: Record<string, UniformValue>): void {
    for (const [name, value] of Object.entries(values)) this.setUniform(name, value);
  }

  /** 上传缓冲脏区间，并在有绑定改动时重建原生绑定组。 */
  override flush(): void {
    this.assertAlive('flush');
    for (const slot of this.bufferSlots.values()) slot.buffer.flush();
    if (!this.pending) return;
    this.nativeGroup = this.buildNative();
    this.pending = false;
  }

  protected override onDestroy(): void {
    this.bufferSlots.clear();
    this.textureSlots.clear();
    this.nativeGroup = null;
    // GPUBindGroup 没有 destroy()：原生对象由 GC 回收，这里只记录一次释放意图
    this.device.commands.record('gpu', 'releaseBindGroup', [this.label]);
  }

  // -------------------------------------------------------------------------

  private applyEntry(name: string, entry: BindGroupEntry): void {
    if (entry.buffer) this.setBuffer(name, entry.buffer, { offset: entry.offset, size: entry.size });
    if (entry.kind === 'sampler' || (entry.texture === undefined && entry.sampler)) {
      this.setTexture(name, null, entry.sampler ?? null);
    } else if (entry.texture) {
      this.setTexture(name, entry.texture, entry.sampler ?? null);
    }
  }

  /** 按当前记录重建原生 GPUBindGroup。 */
  private buildNative(): NativeBindGroup {
    const entries: GPUBindGroupEntry[] = [];
    for (const [name, slot] of this.bufferSlots) {
      const nativeBuffer: NativeBuffer = slot.buffer.native;
      entries.push({
        binding: this.layoutView.bindingOf(name),
        resource: { buffer: nativeBuffer, offset: slot.offset, size: slot.size },
      });
    }
    for (const [name, slot] of this.textureSlots) {
      const texture = slot.texture;
      // null 表示解绑：不产生 entry（布局要求该绑定存在时，createBindGroup 会明确报错）
      if (!texture) continue;
      const binding = this.layoutView.bindingOf(name);
      entries.push({ binding, resource: texture.view });
      if (slot.separateSampler) {
        const sampler = slot.sampler ?? texture.sampler;
        const nativeSampler: NativeSampler = sampler.native;
        // 纹理与采样器在 WebGPU 下是两个 entry，sampler 紧跟纹理的 binding 之后
        entries.push({ binding: binding + 1, resource: nativeSampler });
      }
    }
    const group = this.gpuDevice.createBindGroup({ label: this.label, layout: this.gpuLayout, entries });
    this.device.commands.record('gpu', 'createBindGroup', [this.label, this.group, entries.length]);
    return group;
  }

  /** 用 std140 成员偏移把值写进块对应的绑定缓冲，并立刻上传。 */
  private writeBlockMember(
    blockName: string,
    block: PipelineBlockLayout,
    memberName: string,
    value: UniformValue,
  ): void {
    const slot = this.bufferSlots.get(blockName);
    if (!slot) {
      throw invalidDescriptor(`${this.label}: 块 ${blockName} 尚未绑定缓冲，无法写入 ${memberName}`, {
        hint: `请先 setBuffer('${blockName}', ubo)（可带 offset）。`,
      });
    }
    const member = block.layout.byName.get(memberName);
    if (!member) {
      throw invalidDescriptor(`${this.label}: 块 ${blockName} 没有成员 ${memberName}`, {
        hint: `已声明: ${block.layout.members.map((entry) => entry.name).join(', ') || '(空)'}`,
      });
    }
    // 绑定可以带 offset：写入位置 = 缓冲基准偏移 + 成员在块内的 std140 偏移
    const target = { ...member, offset: slot.offset + member.offset };
    slot.buffer.writer().writeMember(target, value);
    slot.buffer.markDirty(target.offset, member.byteSize);
    this.pending = true;
    this.flush();
  }

  private availableHint(): string {
    const blocks = [...this.layoutView.blocks.keys()];
    const textures = [...this.layoutView.textures.keys()];
    return `已声明的块: ${blocks.join(', ') || '(空)'}；纹理: ${textures.join(', ') || '(空)'}`;
  }
}
