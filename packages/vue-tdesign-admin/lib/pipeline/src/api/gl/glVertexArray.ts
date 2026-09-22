/**
 * WebGL / WebGL2 的顶点数组对象实现。
 *
 * 差异保留：
 *  - WebGL2 / 带 OES_vertex_array_object 的 WebGL1：使用原生 VAO。属性指针与
 *    索引缓冲的绑定都记录在 VAO 里，因此只有"指针脏了"的那一次才需要重设，
 *    之后每次绘制只剩一次 bindVertexArray（且命中 GLStateCache 时连这个都省掉）。
 *  - WebGL1 无扩展：没有原生 VAO，属性状态是全局的 —— 别的对象一改就失效，
 *    因此这里不做脏标记跳过，每次 flush 都把指针整段重放。这是 WebGL1 的固有代价，
 *    库不假装能优化掉它。
 *
 * 索引缓冲属于 VAO 状态，所以它的绑定必须发生在 VAO 绑定期间；这一点在两条路径
 * 里都显式处理了（applyIndexBinding 只在 VAO 已绑定时调用）。
 */
import {
  DEFAULT_VERTEX_BUFFER_SLOT,
  resolveAttributeDescriptor,
  type AttributeDescriptor,
  type ResolvedAttributeDescriptor,
} from '../../core/attribute.js';
import type { Buffer } from '../../core/buffer.js';
import type { Device } from '../../core/device.js';
import { invalidDescriptor, typeMismatch, unsupported } from '../../core/errors.js';
import { BufferRole } from '../../core/handle.js';
import { byteSize } from '../../core/types.js';
import { VertexArray, type BufferBinding, type VertexArrayDescriptor } from '../../core/vertexArray.js';
import {
  gl2,
  glIndexType,
  type GLContext,
  type VertexArrayObjectExtension,
} from './constants.js';
import { GLAttribute } from './glAttribute.js';
import { GLBuffer } from './glBuffer.js';
import type { GLStateCache } from './glState.js';

/** 把 `Buffer | BufferBinding` 归一成绑定项。Buffer 自身没有 buffer 字段，据此区分。 */
function toBinding(value: Buffer | BufferBinding): {
  buffer: Buffer;
  offset?: number;
  stride?: number;
} {
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

export class GLVertexArray extends VertexArray {
  private readonly state: GLStateCache;
  private readonly gl: GLContext;
  /** 是否具备原生 VAO 能力（WebGL2 或 WebGL1 + OES_vertex_array_object） */
  private readonly nativeVaoSupported: boolean;

  private readonly attributeList: GLAttribute[] = [];
  private readonly attributeByName = new Map<string, GLAttribute>();
  private readonly slotMap = new Map<string, GLAttribute[]>();
  /** 布局声明的偏移/跨度；setBuffer 给出槽位基准值时用它还原 */
  private readonly declared = new Map<string, { offset: number; stride: number }>();

  private readonly buffers = new Map<string, GLBuffer>();
  private vao: WebGLVertexArrayObject | null = null;
  private index: GLBuffer | null = null;
  private pointerDirty = true;
  private indexDirty = true;

  constructor(device: Device, descriptor: VertexArrayDescriptor, state: GLStateCache) {
    super(device, descriptor);
    this.state = state;
    this.gl = state.gl;
    this.nativeVaoSupported = state.webgl2 || state.extensions.vertexArrayObject !== null;

    for (const declaration of resolveDeclarations(descriptor, this.label)) {
      // 每个属性持有自己的描述符副本：属性可以单独改偏移，不影响管线布局
      const attribute = new GLAttribute(device, { ...declaration }, state);
      this.attributeList.push(attribute);
      this.attributeByName.set(attribute.name, attribute);
      this.declared.set(attribute.name, { offset: declaration.offset, stride: declaration.stride });
      const list = this.slotMap.get(declaration.buffer) ?? [];
      list.push(attribute);
      this.slotMap.set(declaration.buffer, list);
    }

    for (const [slot, binding] of Object.entries(descriptor.buffers ?? {})) {
      this.setBuffer(slot, binding);
    }
    if (descriptor.indexBuffer) this.indexBuffer = descriptor.indexBuffer;
  }

  override get native(): WebGLVertexArrayObject | null {
    return this.vao;
  }

  /** 是否走原生 VAO 路径；false 表示 WebGL1 的属性重放模式。 */
  get usesNativeVao(): boolean {
    return this.nativeVaoSupported;
  }

  override get attributes(): readonly GLAttribute[] {
    return this.attributeList;
  }

  override attribute(name: string): GLAttribute {
    const found = this.attributeByName.get(name);
    if (!found) {
      throw invalidDescriptor(`${this.label}: 未声明名为 ${name} 的属性`, {
        hint: `已声明: ${[...this.attributeByName.keys()].join(', ') || '(空)'}`,
      });
    }
    return found;
  }

  override get slots(): readonly string[] {
    return [...this.slotMap.keys()];
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
      this.indexDirty = true;
      return;
    }
    if (!(buffer instanceof GLBuffer)) {
      throw typeMismatch(`${this.label}: 索引缓冲只能用 WebGL 缓冲，收到其它后端的 Buffer`);
    }
    if (buffer.role !== BufferRole.Index) {
      throw invalidDescriptor(`${this.label}: 索引缓冲需要 role=Index 的缓冲，收到 ${buffer.role}`);
    }
    if (this.index === buffer) return;
    this.index = buffer;
    this.indexDirty = true;
  }

  override get dirty(): boolean {
    if (this.pointerDirty || this.indexDirty) return true;
    if (this.index && this.index.dirtyRange) return true;
    for (const buffer of this.buffers.values()) if (buffer.dirtyRange) return true;
    for (const attribute of this.attributeList) if (!attribute.enabled) return true;
    return false;
  }

  /**
   * 绑定/替换某个顶点缓冲槽的数据源。
   * offset 是槽位基准偏移，会加到各属性自身的声明偏移上；stride 覆盖槽内所有属性。
   */
  override setBuffer(slot: string, binding: Buffer | BufferBinding | null): void {
    this.assertAlive('setBuffer');
    const attributes = this.slotMap.get(slot);
    if (!attributes || attributes.length === 0) {
      throw invalidDescriptor(`${this.label}: 未知的顶点缓冲槽 ${slot}`, {
        hint: `已声明的槽: ${[...this.slotMap.keys()].join(', ') || '(空)'}`,
      });
    }
    if (binding === null) {
      this.buffers.delete(slot);
      for (const attribute of attributes) attribute.setBuffer(null);
      this.pointerDirty = true;
      return;
    }

    const resolved = toBinding(binding);
    const buffer = resolved.buffer;
    if (!(buffer instanceof GLBuffer)) {
      throw typeMismatch(`${this.label}: 顶点缓冲槽 ${slot} 只能用 WebGL 缓冲，收到其它后端的 Buffer`);
    }
    if (buffer.role !== BufferRole.Vertex) {
      throw invalidDescriptor(`${this.label}: 顶点缓冲槽 ${slot} 需要 role=Vertex 的缓冲，收到 ${buffer.role}`);
    }
    this.buffers.set(slot, buffer);
    for (const attribute of attributes) {
      const declaration = this.declared.get(attribute.name) as { offset: number; stride: number };
      attribute.setBuffer(buffer, {
        offset: declaration.offset + (resolved.offset ?? 0),
        stride: resolved.stride ?? declaration.stride,
      });
    }
    this.pointerDirty = true;
  }

  override flush(): void {
    this.assertAlive('flush');
    // 缓冲的脏区间先上传：属性指针指向的是缓冲对象，内容可以随后再补
    for (const buffer of this.buffers.values()) buffer.flush();
    if (this.index) this.index.flush();
    if (this.nativeVaoSupported) this.flushWithVao();
    else this.replayPointers();
  }

  /** 索引起始字节处绑定的原生缓冲；渲染通道据此决定走 drawElements 还是 drawArrays。 */
  get glIndexBuffer(): WebGLBuffer | null {
    return this.index ? this.index.glBuffer : null;
  }

  /** 索引元素类型（UNSIGNED_SHORT / UNSIGNED_INT）；未绑索引缓冲时抛错。 */
  get indexType(): number {
    if (!this.index) throw invalidDescriptor(`${this.label}: 未绑定索引缓冲，无法确定索引类型`);
    return glIndexType(
      this.index.elementSize,
      this.gl,
      this.state.webgl2,
      this.state.extensions.elementIndexUint,
    );
  }

  /**
   * 按属性跨度推算的可用顶点个数。
   * 只在"未显式给出 vertexCount"时作为 drawArrays 的兜底，取各槽的下界。
   */
  get vertexCapacity(): number {
    let capacity = Number.POSITIVE_INFINITY;
    for (const attribute of this.attributeList) {
      if (attribute.instanced) continue;
      const buffer = attribute.vertexBuffer;
      if (!buffer || attribute.stride <= 0) continue;
      const available = Math.floor((buffer.size - attribute.byteOffset) / attribute.stride);
      if (available < capacity) capacity = available;
    }
    return Number.isFinite(capacity) ? Math.max(0, capacity) : 0;
  }

  protected override onDestroy(): void {
    if (this.vao) {
      this.state.forgetVertexArray(this.vao);
      if (this.state.webgl2) gl2(this.gl).deleteVertexArray(this.vao);
      else (this.state.extensions.vertexArrayObject as VertexArrayObjectExtension).deleteVertexArrayOES(this.vao);
      this.vao = null;
    }
    // 属性由本对象创建，随之一并释放，避免注册表里留下孤儿
    for (const attribute of this.attributeList) attribute.destroy();
    this.attributeList.length = 0;
    this.attributeByName.clear();
    this.slotMap.clear();
    this.declared.clear();
    this.buffers.clear();
    this.index = null;
  }

  // -------------------------------------------------------------------------
  // 生效路径
  // -------------------------------------------------------------------------

  private flushWithVao(): void {
    const vao = this.ensureVao();
    if (this.pointerDirty || this.indexDirty) {
      this.state.bindVertexArray(vao);
      this.applyIndexBinding();
      for (const attribute of this.attributeList) attribute.apply();
      this.pointerDirty = false;
    }
    // 指针已记录在 VAO 里，绘制前唯一要做的就是把 VAO 切回来（命中缓存则整段跳过）
    this.state.bindVertexArray(vao);
  }

  private replayPointers(): void {
    this.applyIndexBinding();
    for (const attribute of this.attributeList) {
      // 无原生 VAO，属性状态随时可能被别的对象改写，这里必须无条件重放
      attribute.markDirty();
      attribute.apply();
    }
    this.pointerDirty = false;
  }

  private applyIndexBinding(): void {
    if (!this.indexDirty) return;
    this.state.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.index ? this.index.glBuffer : null);
    this.indexDirty = false;
  }

  private ensureVao(): WebGLVertexArrayObject {
    if (this.vao) return this.vao;
    const created = this.state.webgl2
      ? gl2(this.gl).createVertexArray()
      : (this.state.extensions.vertexArrayObject as VertexArrayObjectExtension).createVertexArrayOES();
    this.state.call('createVertexArray');
    if (!created) {
      throw unsupported(`${this.label}: 创建原生 VAO 失败，上下文可能已丢失`, { api: this.owner.api });
    }
    this.vao = created;
    return created;
  }
}
