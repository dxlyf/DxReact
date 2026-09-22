/**
 * WebGL / WebGL2 的绑定组实现。
 *
 * 差异保留（重要）：WebGL 没有"绑定组"这个原生对象，因此：
 *  - `native` 恒为 null，`usesNativeBindGroup` 恒为 false；调用方据此可判断
 *    当前是否处于"原生绑定组语义"下（WebGPU 才是）。
 *  - 绑定组的 binding 序号不是显式资源，而是**名字到槽位的映射**：
 *    uniform 块名 -> WebGL2 的 block binding 槽（由 glPipeline 一次性写死），
 *    纹理名 -> 一个固定的纹理单元号（按管线声明顺序分配，多个管线共享同一份顺序）。
 *    因此 GL 侧的绑定组必须先有管线才能解析名字（descriptor.pipeline 必需）。
 *  - flush() 的语义是"把这一组输入提交到当前已绑定的程序"：
 *    块数据上传 + bindBufferBase + 逐单元 bindTexture + 把单元号写进 sampler uniform。
 *    所以调用者必须确保管线已通过 RenderPass.pipeline() 生效（渲染通道会自动保证）。
 *
 * 便捷之处：一次描述整组输入（`{ Globals: { buffer: ubo }, uTexture: { texture: tex } }`），
 * 之后只改变化的部分，flush 时统一提交，不需要手写 activeTexture / bindTexture 的配对。
 */
import type { Buffer } from '../../core/buffer.js';
import { BindGroup, type BindGroupDescriptor, type BindGroupEntry } from '../../core/bindGroup.js';
import type { Device } from '../../core/device.js';
import { invalidDescriptor, typeMismatch } from '../../core/errors.js';
import type { UniformValue } from '../../core/data.js';
import { Sampler, type SamplerDescriptor, type Texture } from '../../core/texture.js';
import type { UniformBlock } from '../../core/uniformBlock.js';
import type { GLStateCache } from './glState.js';
import { GLPipeline } from './glPipeline.js';
import { GLTexture } from './glTexture.js';
import { GLUniformBlock } from './glUniformBlock.js';

/** 一个纹理槽位的当前状态。 */
interface TextureSlot {
  name: string;
  unit: number;
  texture: GLTexture | null;
  sampler: Sampler | null;
  /** 建采样器时用的描述符，用于判断"描述符没变就不重建原生对象" */
  samplerDescriptor: SamplerDescriptor | null;
  /** 采样器由本绑定组创建，销毁时需一并释放 */
  ownsSampler: boolean;
  /** 最近一次绑定的纹理目标，用于解绑时定位 */
  target: number;
}

/** 采样描述符的浅比较：字段固定且都是原始值。 */
function sameSamplerDescriptor(a: SamplerDescriptor | null, b: SamplerDescriptor): boolean {
  if (!a) return false;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if ((a as Record<string, unknown>)[key] !== (b as Record<string, unknown>)[key]) return false;
  }
  return true;
}

export class GLBindGroup extends BindGroup {
  private readonly state: GLStateCache;
  private readonly pipeline: GLPipeline;
  private readonly device: Device;
  /** 管线里真实存在的 uniform 块（GL 跳过合成块） */
  private readonly blockMap = new Map<string, GLUniformBlock>();
  /** 纹理名 -> 固定单元号，按管线声明顺序分配 */
  private readonly unitByName = new Map<string, number>();
  private readonly slots = new Map<string, TextureSlot>();
  /** 纹理 / 单元号有待提交的改动 */
  private bindingsDirty = false;

  constructor(device: Device, descriptor: BindGroupDescriptor, state: GLStateCache, pipeline: GLPipeline) {
    super(device, descriptor);
    this.device = device;
    this.state = state;
    this.pipeline = pipeline;

    const layout = descriptor.pipeline;
    if (!layout) {
      throw invalidDescriptor(
        `${this.label}: WebGL 的绑定组退化为"名字 -> 槽位"映射，必须有 descriptor.pipeline 才能解析名字`,
        { hint: '推荐用 pipeline.createBindGroup({ Globals: { buffer: ubo }, uTexture: { texture: tex } })。' },
      );
    }
    if (layout !== pipeline.layout) {
      throw invalidDescriptor(`${this.label}: 传入的管线布局与创建它的管线不一致`, {
        hint: '绑定组的名字要落在同一个管线上才有意义，请用 pipeline.createBindGroup()。',
      });
    }

    for (const block of pipeline.blocks) {
      if (block instanceof GLUniformBlock) this.blockMap.set(block.name, block);
    }
    // 单元号按声明顺序固定下来：同一管线的多个绑定组才会落在同一批单元上
    let unit = 0;
    for (const name of layout.textures.keys()) this.unitByName.set(name, unit++);

    for (const [name, entry] of Object.entries(descriptor.entries ?? {})) {
      this.applyEntry(name, entry);
    }
  }

  override get native(): GPUBindGroup | null {
    return null;
  }

  /** WebGL 无原生绑定组对象，恒为 false。 */
  get usesNativeBindGroup(): boolean {
    return false;
  }

  override get dirty(): boolean {
    if (this.bindingsDirty) return true;
    for (const block of this.blockMap.values()) {
      if (block.dirty) return true;
    }
    return false;
  }

  /** 名字对应的纹理单元号；未声明时返回 null。 */
  unitOf(name: string): number | null {
    return this.unitByName.get(name) ?? null;
  }

  /** 管线里的 uniform 块（按名字取回，便于直接写值）。 */
  block(name: string): UniformBlock {
    const block = this.blockMap.get(name);
    if (!block) {
      throw invalidDescriptor(`${this.label}: 当前管线没有名为 ${name} 的 uniform 块`, {
        hint: `已声明: ${[...this.blockMap.keys()].join(', ') || '(空)'}`,
      });
    }
    return block;
  }

  override setBuffer(name: string, buffer: Buffer | null, options: { offset?: number; size?: number } = {}): void {
    this.assertAlive('setBuffer');
    const block = this.requireBlockFor(name);
    if (options.offset !== undefined || options.size !== undefined) {
      throw invalidDescriptor(`${this.label}: WebGL 的 uniform 块不支持设置缓冲区间`, {
        hint: 'bindBufferBase 只能整块绑定；共享大型 UBO 请自行按偏移写入再用 setBuffer(name, ubo) 挂载。',
      });
    }
    block.useBuffer(buffer);
  }

  override setTexture(name: string, texture: Texture | null, sampler: Sampler | SamplerDescriptor | null = null): void {
    this.assertAlive('setTexture');
    const slot = this.requireSlot(name);
    if (texture !== null && !(texture instanceof GLTexture)) {
      throw typeMismatch(`${this.label}: ${name} 需要本后端创建的纹理`, {
        hint: '用 device.createTexture() 创建。',
      });
    }
    slot.texture = texture;
    if (texture) slot.target = (texture as GLTexture).glTarget;
    if (sampler !== null) this.assignSampler(slot, sampler);
    this.bindingsDirty = true;
  }

  /**
   * 写入 uniform 值。名字支持两种写法：
   *  - `Globals.uTime` —— 块的成员，等价于 pipeline.block('Globals').set('uTime', v)
   *  - `uColor`       —— 游离 uniform
   */
  override setUniform(name: string, value: UniformValue): void {
    this.assertAlive('setUniform');
    const dot = name.indexOf('.');
    if (dot > 0) {
      const blockName = name.slice(0, dot);
      const block = this.blockMap.get(blockName);
      if (!block) {
        throw invalidDescriptor(`${this.label}: 未声明名为 ${blockName} 的 uniform 块`, {
          hint: `已声明: ${[...this.blockMap.keys()].join(', ') || '(空)'}`,
        });
      }
      block.set(name.slice(dot + 1), value);
      return;
    }
    if (this.blockMap.has(name)) {
      throw invalidDescriptor(`${this.label}: ${name} 是 uniform 块，不能整体赋值`, {
        hint: `请写成 ${name}.成员名，或直接用 pipeline.block('${name}').set(...)。`,
      });
    }
    this.pipeline.setUniform(name, value);
  }

  override setUniforms(values: Record<string, UniformValue>): void {
    for (const [name, value] of Object.entries(values)) this.setUniform(name, value);
  }

  /**
   * 提交本组输入。要求当前程序已绑定（块的 binding 与 sampler uniform 都是程序级状态），
   * RenderPass 会在调用前先 application 管线。
   */
  override flush(): void {
    this.assertAlive('flush');
    for (const block of this.blockMap.values()) block.flush();
    if (!this.bindingsDirty) return;
    for (const slot of this.slots.values()) this.flushSlot(slot);
    this.bindingsDirty = false;
  }

  protected override onDestroy(): void {
    for (const slot of this.slots.values()) {
      if (slot.ownsSampler) slot.sampler?.destroy();
      slot.sampler = null;
      slot.texture = null;
    }
    this.slots.clear();
    this.blockMap.clear();
    this.unitByName.clear();
  }

  // -------------------------------------------------------------------------

  private applyEntry(name: string, entry: BindGroupEntry): void {
    if (entry.kind === 'storage') {
      throw invalidDescriptor(`${this.label}: WebGL 没有 storage buffer（SSBO）`, {
        hint: 'capabilities.storageBuffers 为 false；改用 uniform 块或纹理。',
      });
    }
    if (entry.kind === 'sampler' || (entry.texture === undefined && entry.sampler)) {
      this.setTexture(name, null, entry.sampler ?? null);
    } else if (entry.texture) {
      this.setTexture(name, entry.texture, entry.sampler ?? null);
    }
    if (entry.buffer) {
      this.setBuffer(name, entry.buffer, { offset: entry.offset, size: entry.size });
    }
  }

  private requireBlockFor(name: string): GLUniformBlock {
    const block = this.blockMap.get(name);
    if (block) return block;
    if (this.unitByName.has(name)) {
      throw invalidDescriptor(`${this.label}: ${name} 是纹理，不能用 setBuffer 绑定缓冲`, {
        hint: `请用 setTexture('${name}', texture)。`,
      });
    }
    throw invalidDescriptor(`${this.label}: 当前管线没有名为 ${name} 的 uniform 块`, {
      hint: `已声明: ${[...this.blockMap.keys()].join(', ') || '(空)'}`,
    });
  }

  private requireSlot(name: string): TextureSlot {
    const existing = this.slots.get(name);
    if (existing) return existing;
    const unit = this.unitByName.get(name);
    if (unit === undefined) {
      const blocks = [...this.blockMap.keys()];
      if (blocks.includes(name)) {
        throw invalidDescriptor(`${this.label}: ${name} 是 uniform 块，不能用 setTexture 绑定纹理`, {
          hint: `请用 setBuffer('${name}', ubo) 或 setUniform('${name}.成员名', value)。`,
        });
      }
      throw invalidDescriptor(`${this.label}: 当前管线没有名为 ${name} 的纹理`, {
        hint: `已声明: ${[...this.unitByName.keys()].join(', ') || '(空)'}`,
      });
    }
    const slot: TextureSlot = {
      name,
      unit,
      texture: null,
      sampler: null,
      samplerDescriptor: null,
      ownsSampler: false,
      target: 0,
    };
    this.slots.set(name, slot);
    return slot;
  }

  /** 采样器可以传资源（复用）或描述符（本组代为创建并持有）。 */
  private assignSampler(slot: TextureSlot, sampler: Sampler | SamplerDescriptor): void {
    if (sampler instanceof Sampler) {
      if (slot.ownsSampler) slot.sampler?.destroy();
      slot.sampler = sampler;
      slot.samplerDescriptor = null;
      slot.ownsSampler = false;
      return;
    }
    // 描述符没变就不重建原生采样器（采样描述符的字段都是原始值，浅比较足够）
    if (slot.ownsSampler && sameSamplerDescriptor(slot.samplerDescriptor, sampler)) return;
    if (slot.ownsSampler) slot.sampler?.destroy();
    slot.sampler = this.device.createSampler(sampler);
    slot.samplerDescriptor = { ...sampler };
    slot.ownsSampler = true;
  }

  private flushSlot(slot: TextureSlot): void {
    const texture = slot.texture;
    if (!texture) {
      // 解除绑定：把 null 绑到原目标上，避免上一次的纹理残留在该单元
      if (slot.target !== 0) this.state.bindTexture(slot.unit, slot.target, null);
      return;
    }
    if (slot.sampler && texture.sampler !== slot.sampler) texture.setSampler(slot.sampler);
    texture.bindToUnit(slot.unit);
    // 采样器 uniform 只是"读哪个单元"，真正的采样参数在纹理 / 采样器对象上
    if (!this.pipeline.setSamplerUnit(slot.name, slot.unit)) {
      throw invalidDescriptor(`${this.label}: 纹理 ${slot.name} 在着色器里未被使用`, {
        hint: '驱动会优化掉未采样的纹理，请检查片元着色器是否真的读了这个 sampler。',
      });
    }
    this.state.call('bindGroup.flush', slot.name, slot.unit);
  }
}
