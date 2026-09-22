/**
 * 顶点数组对象（VAO）。
 *
 * 它是"属性声明 + 实际顶点缓冲"的结合体，把绘制前那串易错的状态设置变成一个对象：
 *   gl.bindBuffer(ARRAY_BUFFER, vbo);
 *   gl.vertexAttribPointer(loc, 3, FLOAT, false, stride, offset);
 *   gl.enableVertexAttribArray(loc);
 * 上面三行的组合在库里就是 `vao.setBuffer('position', vbo)` 一句话。
 *
 * 差异保留：
 *  - WebGL2：原生 VAO 对象，切换即恢复全部属性状态
 *  - WebGL1：无原生 VAO（除非有 OES_vertex_array_object），退化为状态管理器按脏标记重放属性
 *  - WebGPU：无 VAO 概念，顶点缓冲与布局在管线创建时固定；本对象退化为
 *    "顶点缓冲槽绑定集合"，在 setVertexArray 时一次性 setVertexBuffer
 * native 在 WebGL1/WebGPU 下返回 null，调用方可据此判断。
 */
import type { Attribute, AttributeDescriptor } from './attribute.js';
import type { Buffer } from './buffer.js';
import { ResourceKind } from './handle.js';
import type { PipelineLayoutView } from './pipeline.js';
import { Resource, type ResourceOwner } from './resource.js';

/** 顶点缓冲槽绑定。offset 用于把多份数据放进同一张大缓冲。 */
export interface BufferBinding {
  buffer: Buffer;
  offset?: number;
  stride?: number;
}

export interface VertexArrayDescriptor {
  label?: string;
  /**
   * 沿用的管线布局。
   * 传入后 attributes 可省略，是"由管线声明快速生成入参"的推荐路径：
   *   pipeline.createVertexArray({ position: vbo, uv: vbo2 })
   */
  pipeline?: PipelineLayoutView;
  /** 不依赖管线时自行声明属性 */
  attributes?: readonly AttributeDescriptor[];
  /** 顶点缓冲槽名 -> 缓冲 */
  buffers?: Record<string, Buffer | BufferBinding>;
  /** 索引缓冲 */
  indexBuffer?: Buffer;
}

export abstract class VertexArray extends Resource {
  protected constructor(owner: ResourceOwner, descriptor: VertexArrayDescriptor) {
    super(owner, ResourceKind.VertexArray, descriptor.label ?? 'vao');
  }

  /** 原生 VAO：WebGL2（或有 OES_vertex_array_object 的 WebGL1）返回 WebGLVertexArrayObject，其余为 null。 */
  abstract get native(): WebGLVertexArrayObject | null;

  abstract get attributes(): readonly Attribute[];

  /** 按属性名取回属性对象，用于单独改偏移或换缓冲。 */
  abstract attribute(name: string): Attribute;

  /** 是否还有未生效的绑定/指针改动。 */
  abstract get dirty(): boolean;

  /** 绑定/替换某个顶点缓冲槽的数据源。传 null 解除绑定。 */
  abstract setBuffer(slot: string, binding: Buffer | BufferBinding | null): void;

  abstract getBuffer(slot: string): Buffer | null;

  /** 已绑定的缓冲槽名列表。 */
  abstract get slots(): readonly string[];

  abstract get indexBuffer(): Buffer | null;

  abstract set indexBuffer(buffer: Buffer | null);

  /** 索引个数（索引缓冲已绑定时可用），用于 drawElements 的便捷调用。 */
  get indexCount(): number {
    const buffer = this.indexBuffer;
    return buffer ? buffer.count : 0;
  }

  /**
   * 让所有绑定生效：上传脏缓冲、刷新属性指针。
   * 设备在绘制前会自动调用；手动调用用于在绘制前提前完成开销。
   */
  abstract flush(): void;
}
