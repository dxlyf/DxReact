/**
 * 顶点属性资源。
 *
 * 属性是"着色器入参"与"顶点缓冲内存区间"之间的绑定关系，必须显式表达：
 *  名称 + 格式 + 哪个顶点缓冲槽 + 槽内偏移/跨度 + 逐顶点还是逐实例
 *
 * 差异保留：
 *  - WebGL：属性有 location，且必须在绘制前调用 vertexAttribPointer 设置指针；
 *    未声明 location 时按声明顺序分配，也可由管线用着色器反射结果覆盖。
 *  - WebGPU：属性只有 shaderLocation 与格式，指针由管线创建时的 vertex.buffers 固定，
 *    本对象退化为布局声明 + 数据源记录。
 *
 * 两种情况下 Attribute 都承担同一职责：让 setBuffer / setFormat 这类动作在
 * 脏标记体系里有明确落点，避免每次绘制都重设指针。
 */
import type { Buffer } from './buffer.js';
import { ResourceKind } from './handle.js';
import { Resource, type ResourceOwner } from './resource.js';
import { assertAttributeType, byteSize, ShaderDataType, VertexStepMode } from './types.js';

export interface AttributeDescriptor {
  /** 着色器中的属性名 */
  name: string;
  format: ShaderDataType;
  /** 所属顶点缓冲槽名，默认 'main'。同槽属性会被打包进同一张缓冲 */
  buffer?: string;
  /** 槽内字节偏移。省略时按同槽声明顺序自动累加 */
  offset?: number;
  /** 记录跨度。省略时按同槽紧密排列自动计算 */
  stride?: number;
  /** 显式指定 location（WebGL）/ shaderLocation（WebGPU） */
  location?: number;
  /** 取用方式，默认逐顶点 */
  stepMode?: VertexStepMode;
  /** WebGL 语义的 divisor，与 stepMode 二选一 */
  divisor?: number;
  /** 是否归一化。U8 系与 U16 系类型默认 true */
  normalized?: boolean;
}

export interface ResolvedAttributeDescriptor {
  name: string;
  format: ShaderDataType;
  buffer: string;
  offset: number;
  stride: number;
  location: number;
  stepMode: VertexStepMode;
  divisor: number;
  normalized: boolean;
}

export const DEFAULT_VERTEX_BUFFER_SLOT = 'main';

/**
 * 补齐默认值。
 * stride/offset 的自动推导需要在"同槽全部属性"范围内进行，因此由管线布局阶段传入
 * 已算好的 stride，这里只负责单个属性的默认值与校验。
 */
export function resolveAttributeDescriptor(
  descriptor: AttributeDescriptor,
  index: number,
  stride?: number,
): ResolvedAttributeDescriptor {
  if (!descriptor.name) throw new TypeError('AttributeDescriptor.name 不能为空');
  assertAttributeType(descriptor.format, `Attribute(${descriptor.name})`);
  const divisor = descriptor.divisor ?? (descriptor.stepMode === VertexStepMode.Instance ? 1 : 0);
  const stepMode = descriptor.stepMode ?? (divisor > 0 ? VertexStepMode.Instance : VertexStepMode.Vertex);
  return {
    name: descriptor.name,
    format: descriptor.format,
    buffer: descriptor.buffer ?? DEFAULT_VERTEX_BUFFER_SLOT,
    offset: descriptor.offset ?? 0,
    stride: descriptor.stride ?? stride ?? byteSize(descriptor.format),
    location: descriptor.location ?? index,
    stepMode,
    divisor,
    normalized:
      descriptor.normalized ?? (descriptor.format.startsWith('u8') || descriptor.format.startsWith('u16')),
  };
}

export abstract class Attribute extends Resource {
  readonly descriptor: ResolvedAttributeDescriptor;

  protected constructor(owner: ResourceOwner, descriptor: ResolvedAttributeDescriptor, label?: string) {
    super(owner, ResourceKind.Attribute, label ?? descriptor.name);
    this.descriptor = descriptor;
  }

  get name(): string {
    return this.descriptor.name;
  }

  get format(): ShaderDataType {
    return this.descriptor.format;
  }

  /** WebGL 的 attribute location / WebGPU 的 shaderLocation */
  get location(): number {
    return this.descriptor.location;
  }

  /** 在顶点缓冲内的起始字节偏移 */
  get byteOffset(): number {
    return this.descriptor.offset;
  }

  /** 顶点缓冲的记录跨度 */
  get stride(): number {
    return this.descriptor.stride;
  }

  get stepMode(): VertexStepMode {
    return this.descriptor.stepMode;
  }

  get instanced(): boolean {
    return this.descriptor.stepMode === VertexStepMode.Instance;
  }

  /** 单个元素占用的字节数（不含对齐填充） */
  get byteSize(): number {
    return byteSize(this.descriptor.format);
  }

  /** 当前数据源 */
  abstract get buffer(): Buffer | null;

  /** 绑定数据源。offset/stride 省略时沿用声明值。 */
  abstract setBuffer(buffer: Buffer | null, options?: { offset?: number; stride?: number }): void;

  /** 指针是否已按当前绑定生效（WebGL 脏标记；WebGPU 恒为 true）。 */
  abstract get enabled(): boolean;

  /** 强制下次绘制重新设置指针。 */
  abstract markDirty(): void;

  override describe(): string {
    const d = this.descriptor;
    return `${d.name}:${d.format}@slot(${d.buffer})+${d.offset}/${d.stride} loc=${d.location}`;
  }
}
