/**
 * WebGPU 的顶点数组对象实现。
 *
 * 与 GL 侧的差异（保留，不做抹平）：
 *  - WebGPU 没有原生 VAO：native 恒为 null，调用方据此判断自己该走哪条绑定路径。
 *  - 顶点缓冲布局（元素格式、element offset、arrayStride、stepMode）在
 *    createRenderPipeline 时就固定了，绘制时只剩下 setVertexBuffer，
 *    因此本类退化为"顶点缓冲槽绑定集合"：只记录 slot -> { buffer, offset, stride }。
 *  - 这些记录必须按管线布局的槽位声明顺序生效，否则 setVertexBuffer(slotIndex, ...)
 *    会错位（这是 WebGPU 最容易踩的坑），因此对外提供 bindings() 让渲染通道
 *    按正确顺序取绑定，而不是让它自己遍历 Map 猜顺序。
 *  - 索引缓冲：WebGPU 的 setIndexBuffer(format, buffer) 在绘制时调用，所以这里只保存
 *    索引缓冲，并把索引格式一并推导出来（由元素字节数经 gpuIndexFormat 得到）。
 *  - 属性指针在 WebGPU 不存在，因此没有 GL 侧那套 pointerDirty / 重放逻辑：
 *    dirty 只表示"缓冲还有未上传的脏数据"或"绑定刚变过"。
 *
 * 与 GL 相同的一点：属性对象由本类创建并持有，随本对象一起销毁，避免注册表里留下孤儿。
 */
import {
  DEFAULT_VERTEX_BUFFER_SLOT,
  resolveAttributeDescriptor,
  type AttributeDescriptor,
  type ResolvedAttributeDescriptor,
} from '../../core/attribute.js';
import type { Buffer } from '../../core/buffer.js';
import type { Device } from '../../core/device.js';
import { invalidDescriptor, typeMismatch } from '../../core/errors.js';
import { BufferRole } from '../../core/handle.js';
import { byteSize } from '../../core/types.js';
import { VertexArray, type BufferBinding, type VertexArrayDescriptor } from '../../core/vertexArray.js';
import { gpuIndexFormat } from './format.js';
import { GPUAttribute } from './gpuAttribute.js';
import { GPUBuffer } from './gpuBuffer.js';

/** 一个顶点缓冲槽的绑定记录。渲染通道按 bindings() 的顺序逐槽调用 setVertexBuffer。 */
export interface GPUSlotBinding {
  slot: string;
  buffer: Buffer;
  /** 槽位基准字节偏移（setVertexBuffer 的 offset） */
  offset: number;
  /** 该槽的 arrayStride，建 GPUVertexBufferLayout 时用 */
  stride: number;
  /** 该槽是否为逐实例步进 */
  instanced: boolean;
}

/** 把 `Buffer | BufferBinding` 归一成绑定项。Buffer 自身没有 buffer 字段，据此区分。 */
function toBinding(value: Buffer | BufferBinding): { buffer: Buffer; offset?: number; stride?: number } {
  if ('buffer' in value) return value;
  return { buffer: value };
}

/**
 * 独立声明（不经管线布局）时推导每个属性所在槽的紧密跨度。
 * 规则与 PipelineLayout 内部的推导一致：同槽按声明顺序紧密排列，跨度取该槽最大跨度。
 */
function packedStrides(attributes: readonly AttributeDescriptor[]): number[] {
  const ends = new Map<string, number>();
  const strides = new Map<string, number>();
  for (const attribute of attributes) {
    const slot = attribute.buffer ?? DEFAULT_VERTEX_BUFFER_SLOT;
    const offset = attribute.offset ?? ends.get(slot) ?? 0;
    ends.set(slot, offset + byteSize(attribute.format));
    if (attribute.stride !== undefined) {
      strides.set(slot, Math.max(strides.get(slot) ?? 0, attribute.stride));
    }
  }
  for (const [slot, end] of ends) strides.set(slot, Math.max(strides.get(slot) ?? 0, end));
  return attributes.map(
    (attribute) => strides.get(attribute.buffer ?? DEFAULT_VERTEX_BUFFER_SLOT) ?? byteSize(attribute.format),
  );
}

function resolveDeclarations(descriptor: VertexArrayDescriptor, label: string): ResolvedAttributeDescriptor[] {
  if (descriptor.pipeline) {
    // 布局里的属性已是解析过的结果，再走一次 resolve 只做默认值补齐，值不会被改写
    return descriptor.pipeline.attributeList.map((attribute, index) => resolveAttributeDescriptor(attribute, index));
  }
  const attributes = descriptor.attributes ?? [];
  if (attributes.length === 0) {
    throw invalidDescriptor(`${label}: 需要提供 pipeline 布局或 attributes 声明之一`, {
      hint: '推荐用 pipeline.createVertexArray({ position: vbo }) 直接沿用管线布局。',
    });
  }
  const strides = packedStrides(attributes);
  return attributes.map((attribute, index) => resolveAttributeDescriptor(attribute, index, strides[index]));
}

export class GPUVertexArray extends VertexArray {
  private readonly attributeList: GPUAttribute[] = [];
  private readonly attributeByName = new Map<string, GPUAttribute>();
  private readonly slotMap = new Map<string, GPUAttribute[]>();
  /** 布局声明的偏移/跨度；setBuffer 给出槽位基准值时用它还原 */
  private readonly declared = new Map<string, { offset: number; stride: number }>();
  /** 槽 -> 布局声明的跨度（同槽属性的最大 stride），作为绑定的默认 arrayStride */
  private readonly slotStrides = new Map<string, number>();
  /** 槽位顺序：有管线时取管线布局的声明顺序，否则取属性声明顺序 */
  private readonly layoutOrder: string[];

  private readonly buffers = new Map<string, GPUBuffer>();
  private readonly bindingsBySlot = new Map<string, GPUSlotBinding>();
  private index: GPUBuffer | null = null;
  private bindingDirty = true;

  constructor(device: Device, descriptor: VertexArrayDescriptor) {
    super(device, descriptor);

    for (const declaration of resolveDeclarations(descriptor, this.label)) {
      // 每个属性持有自己的描述符副本：属性可以单独改偏移，不影响管线布局
      const attribute = new GPUAttribute(device, { ...declaration });
      this.attributeList.push(attribute);
      this.attributeByName.set(attribute.name, attribute);
      this.declared.set(attribute.name, { offset: declaration.offset, stride: declaration.stride });
      const list = this.slotMap.get(declaration.buffer) ?? [];
      list.push(attribute);
      this.slotMap.set(declaration.buffer, list);
      this.slotStrides.set(
        declaration.buffer,
        Math.max(this.slotStrides.get(declaration.buffer) ?? 0, declaration.stride),
      );
    }
    // WebGPU 的每个 GPUVertexBufferLayout 只有一个 stepMode，同槽不能混用
    for (const [slot, attributes] of this.slotMap) {
      if (attributes.some((attribute) => attribute.instanced !== attributes[0].instanced)) {
        throw invalidDescriptor(`${this.label}: 顶点缓冲槽 ${slot} 内混用了逐顶点与逐实例属性`, {
          hint: 'WebGPU 的每个 GPUVertexBufferLayout 只有一个 stepMode，请把两者拆到不同槽。',
        });
      }
    }

    this.layoutOrder = descriptor.pipeline ? [...descriptor.pipeline.slots().keys()] : [...this.slotMap.keys()];
    for (const [slot, binding] of Object.entries(descriptor.buffers ?? {})) {
      this.setBuffer(slot, binding);
    }
    if (descriptor.indexBuffer) this.indexBuffer = descriptor.indexBuffer;
  }

  /** WebGPU 没有原生 VAO，恒为 null。 */
  override get native(): WebGLVertexArrayObject | null {
    return null;
  }

  override get attributes(): readonly GPUAttribute[] {
    return this.attributeList;
  }

  override attribute(name: string): GPUAttribute {
    const found = this.attributeByName.get(name);
    if (!found) {
      throw invalidDescriptor(`${this.label}: 未声明名为 ${name} 的属性`, {
        hint: `已声明: ${[...this.attributeByName.keys()].join(', ') || '(空)'}`,
      });
    }
    return found;
  }

  override get slots(): readonly string[] {
    return this.layoutOrder;
  }

  override getBuffer(slot: string): Buffer | null {
    return this.buffers.get(slot) ?? null;
  }

  override get indexBuffer(): Buffer | null {
    return this.index;
  }

  override set indexBuffer(buffer: Buffer | null) {
    this.assertAlive('indexBuffer');
    if (buffer === null) {
      this.index = null;
      this.bindingDirty = true;
      return;
    }
    if (!(buffer instanceof GPUBuffer)) {
      throw typeMismatch(`${this.label}: 索引缓冲只能用 WebGPU 缓冲，收到其它后端的 Buffer`);
    }
    if (buffer.role !== BufferRole.Index) {
      throw invalidDescriptor(`${this.label}: 索引缓冲需要 role=Index 的缓冲，收到 ${buffer.role}`);
    }
    if (this.index === buffer) return;
    this.index = buffer;
    this.bindingDirty = true;
  }

  /** WebGPU 侧没有指针状态，脏只来自"绑定刚变过"或"缓冲尚有未上传区间"。 */
  override get dirty(): boolean {
    if (this.bindingDirty) return true;
    for (const binding of this.bindingsBySlot.values()) if (binding.buffer.dirtyRange) return true;
    if (this.index && this.index.dirtyRange) return true;
    return false;
  }

  /**
   * 绑定/替换某个顶点缓冲槽的数据源。
   * offset 是槽位基准偏移（setVertexBuffer 的 offset），会加到各属性自身的声明偏移上；
   * stride 覆盖该槽的 arrayStride，省略时用布局声明的跨度。
   */
  override setBuffer(slot: string, binding: Buffer | BufferBinding | null): void {
    this.assertAlive('setBuffer');
    const attributes = this.slotMap.get(slot);
    if (!attributes || attributes.length === 0) {
      throw invalidDescriptor(`${this.label}: 未知的顶点缓冲槽 ${slot}`, {
        hint: `已声明的槽: ${this.layoutOrder.join(', ') || '(空)'}`,
      });
    }
    if (binding === null) {
      this.buffers.delete(slot);
      this.bindingsBySlot.delete(slot);
      for (const attribute of attributes) attribute.setBuffer(null);
      this.bindingDirty = true;
      return;
    }

    const resolved = toBinding(binding);
    const buffer = resolved.buffer;
    if (!(buffer instanceof GPUBuffer)) {
      throw typeMismatch(`${this.label}: 顶点缓冲槽 ${slot} 只能用 WebGPU 缓冲，收到其它后端的 Buffer`);
    }
    if (buffer.role !== BufferRole.Vertex) {
      throw invalidDescriptor(`${this.label}: 顶点缓冲槽 ${slot} 需要 role=Vertex 的缓冲，收到 ${buffer.role}`);
    }
    const offset = resolved.offset ?? 0;
    if (!Number.isInteger(offset) || offset < 0) {
      throw invalidDescriptor(`${this.label}: 顶点缓冲槽 ${slot} 的 offset 必须是非负整数，收到 ${offset}`);
    }
    if (offset % 4 !== 0) {
      throw invalidDescriptor(`${this.label}: 顶点缓冲槽 ${slot} 的 offset(${offset}) 不是 4 的倍数`, {
        hint: 'WebGPU 的 setVertexBuffer 要求 offset 对齐到 4 字节。',
      });
    }
    const stride = resolved.stride ?? this.slotStrides.get(slot) ?? 0;
    if (!Number.isInteger(stride) || stride <= 0) {
      throw invalidDescriptor(`${this.label}: 顶点缓冲槽 ${slot} 的 stride 必须是正整数，收到 ${stride}`);
    }

    this.buffers.set(slot, buffer);
    this.bindingsBySlot.set(slot, { slot, buffer, offset, stride, instanced: attributes[0].instanced });
    for (const attribute of attributes) {
      const declaration = this.declared.get(attribute.name) as { offset: number; stride: number };
      attribute.setBuffer(buffer, {
        offset: declaration.offset + offset,
        stride: resolved.stride ?? declaration.stride,
      });
    }
    this.bindingDirty = true;
  }

  /**
   * 按管线布局的槽位声明顺序返回待绑定的槽（没有管线时按属性声明顺序）。
   * 布局里声明了却没绑缓冲的槽会抛错——静默跳过会让 setVertexBuffer 的序号整体错位。
   */
  bindings(): readonly GPUSlotBinding[] {
    this.assertAlive('bindings');
    const result: GPUSlotBinding[] = [];
    for (const slot of this.layoutOrder) {
      const binding = this.bindingsBySlot.get(slot);
      if (!binding) {
        throw invalidDescriptor(`${this.label}: 顶点缓冲槽 ${slot} 尚未绑定缓冲`, {
          hint: `已绑定的槽: ${[...this.bindingsBySlot.keys()].join(', ') || '(空)'}`,
        });
      }
      result.push(binding);
    }
    return result;
  }

  override flush(): void {
    this.assertAlive('flush');
    // WebGPU 的 setVertexBuffer 直接引用 GPUBuffer，所以只需保证内容已上传
    for (const binding of this.bindingsBySlot.values()) binding.buffer.flush();
    if (this.index) this.index.flush();
    this.bindingDirty = false;
  }

  /** 索引缓冲的原生句柄；渲染通道据此决定走 drawIndexed 还是 draw。 */
  get gpuIndexBuffer(): GPUBuffer | null {
    return this.index;
  }

  /** 索引元素格式；未绑索引缓冲时抛错。setIndexBuffer(format, buffer) 的第一参即此值。 */
  get indexFormat(): GPUIndexFormat {
    if (!this.index) throw invalidDescriptor(`${this.label}: 未绑定索引缓冲，无法确定索引格式`);
    return gpuIndexFormat(this.index.elementSize);
  }

  /**
   * 按属性跨度推算的可用顶点个数。
   * 只在"未显式给出 vertexCount"时作为 draw 的兜底，取各槽的下界。
   */
  get vertexCapacity(): number {
    let capacity = Number.POSITIVE_INFINITY;
    for (const attribute of this.attributeList) {
      if (attribute.instanced) continue;
      const buffer = attribute.gpuBuffer;
      if (!buffer || attribute.stride <= 0) continue;
      const available = Math.floor((buffer.size - attribute.byteOffset) / attribute.stride);
      if (available < capacity) capacity = available;
    }
    return Number.isFinite(capacity) ? Math.max(0, capacity) : 0;
  }

  protected override onDestroy(): void {
    // 属性由本对象创建，随之一并释放，避免注册表里留下孤儿
    for (const attribute of this.attributeList) attribute.destroy();
    this.attributeList.length = 0;
    this.attributeByName.clear();
    this.slotMap.clear();
    this.declared.clear();
    this.slotStrides.clear();
    this.buffers.clear();
    this.bindingsBySlot.clear();
    this.index = null;
  }
}
