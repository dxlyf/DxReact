/**
 * WebGPU 的顶点属性实现。
 *
 * 与 GL 侧的差异（保留，不做抹平）：
 *  - 没有"顶点指针"这回事。WebGPU 的顶点缓冲布局（GPUVertexBufferLayout）在
 *    createRenderPipeline 时就固定了，绘制时只能通过 setVertexBuffer 换数据源，
 *    因此 GLAttribute.apply() / disable() 那套原生调用在 WebGPU 上不存在：
 *    本类只做"格式合法性校验 + 数据源记录"。
 *  - 因此 enabled 恒为 true —— 不存在"指针是否已按当前绑定写入"的状态。
 *  - markDirty() 退化为"记录一次布局变更"（layoutRevision 自增），不产生任何原生调用，
 *    也不会抛错；它只用于让上层的布局缓存失效。
 *  - 属性格式在构造期就用 gpuVertexFormat 校验：矩阵类型在 WebGPU 没有对应的
 *    GPUVertexFormat，必须在这里抛出清晰错误，而不是等到建管线时才失败。
 *
 * 归属与 GLAttribute 相同：实例由 GPUVertexArray 创建并持有，只是不再需要
 * "一个属性只属于一个 VAO"的限制 —— WebGPU 的属性本来就只是声明与记录。
 */
import { Attribute, type ResolvedAttributeDescriptor } from '../../core/attribute.js';
import type { Buffer } from '../../core/buffer.js';
import type { Device } from '../../core/device.js';
import { invalidDescriptor, typeMismatch } from '../../core/errors.js';
import { BufferRole } from '../../core/handle.js';
import { gpuStepMode, gpuVertexFormat } from './format.js';
import { GPUBuffer } from './gpuBuffer.js';

export class GPUAttribute extends Attribute {
  /** 构造期就确定的 GPUVertexFormat，避免每次建管线都重复查表 */
  private readonly formatValue: GPUVertexFormat;

  private source: GPUBuffer | null = null;
  /** 布局变更次数。WebGPU 的布局在管线里，这里只作为上层缓存失效的信号 */
  private layoutRevisionValue = 0;

  constructor(device: Device, descriptor: ResolvedAttributeDescriptor) {
    super(device, descriptor);
    // 没有对应的 GPUVertexFormat（矩阵、非法组合）在这里立刻抛错
    this.formatValue = gpuVertexFormat(descriptor.format, descriptor.normalized);
  }

  override get buffer(): Buffer | null {
    return this.source;
  }

  /** WebGPU 侧的数据源（GPUBuffer）；未绑定时为 null。 */
  get gpuBuffer(): GPUBuffer | null {
    return this.source;
  }

  /** 属性的 GPUVertexFormat，建 GPUVertexBufferLayout 时直接用。 */
  get vertexFormat(): GPUVertexFormat {
    return this.formatValue;
  }

  /** 顶点步进模式（逐顶点 / 逐实例）。 */
  get gpuStepMode(): GPUVertexStepMode {
    return gpuStepMode(this.instanced);
  }

  /** 布局变更次数，单调递增；WebGPU 下改变它不会立刻影响原生状态。 */
  get layoutRevision(): number {
    return this.layoutRevisionValue;
  }

  /** WebGPU 没有属性指针，属性始终"已生效"。 */
  override get enabled(): boolean {
    return true;
  }

  /**
   * 记录数据源。offset/stride 省略时沿用声明值。
   * WebGPU 的 element offset / arrayStride 属于管线布局，因此这里的改动只影响
   * 后续的布局推导（layoutRevision），不会触发任何原生调用。
   */
  override setBuffer(buffer: Buffer | null, options: { offset?: number; stride?: number } = {}): void {
    this.assertAlive('setBuffer');
    if (buffer !== null && !(buffer instanceof GPUBuffer)) {
      throw typeMismatch(`属性 ${this.name} 只能绑定 WebGPU 缓冲，收到其它后端的 Buffer`);
    }
    if (buffer && buffer.role !== BufferRole.Vertex) {
      throw invalidDescriptor(`属性 ${this.name} 只能绑定 role=Vertex 的缓冲，收到 ${buffer.role}`);
    }
    const offset = options.offset ?? this.descriptor.offset;
    const stride = options.stride ?? this.descriptor.stride;
    if (!Number.isInteger(offset) || offset < 0) {
      throw invalidDescriptor(`属性 ${this.name} 的 offset 必须是非负整数，收到 ${offset}`);
    }
    if (!Number.isInteger(stride) || stride <= 0) {
      throw invalidDescriptor(`属性 ${this.name} 的 stride 必须是正整数，收到 ${stride}`);
    }
    if (stride < offset + this.byteSize) {
      throw invalidDescriptor(
        `属性 ${this.name} 的 stride(${stride}) 小于 offset(${offset}) + 元素大小(${this.byteSize})`,
      );
    }
    const unchanged =
      this.source === buffer && this.descriptor.offset === offset && this.descriptor.stride === stride;
    this.source = buffer;
    this.descriptor.offset = offset;
    this.descriptor.stride = stride;
    if (!unchanged) this.markDirty();
  }

  /** 语义弱化：只记录一次布局变更，不抛错、不产生原生调用。 */
  override markDirty(): void {
    this.layoutRevisionValue++;
  }

  protected override onDestroy(): void {
    this.source = null;
  }
}
