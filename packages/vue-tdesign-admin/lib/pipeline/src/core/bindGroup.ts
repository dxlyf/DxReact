/**
 * 绑定组资源（WebGPU 原生概念）。
 *
 * 差异保留：
 *  - WebGPU：BindGroup 是原生对象，布局必须与 pipeline layout 完全一致，
 *    uniform buffer / texture / sampler 混在同一个 GPUBindGroup 里。
 *    库的便捷之处是：绑定组布局可由管线声明自动推导，不需要手写 GPUBindGroupLayoutDescriptor。
 *  - WebGL：不存在绑定组。这里退化为"uniform 块 + 纹理单元的命名集合"，
 *    setBuffer / setUniform 会直接作用到对应槽位，flush 时统一生效。
 *    调用方可以据此把 GL 侧的 bind group 当成"一次描述整组输入"的便捷容器。
 *
 * native 在 WebGL 下返回 null，调用方可据此判断是否处于原生绑定组语义下。
 */
import type { Buffer } from './buffer.js';
import type { UniformValue } from './data.js';
import { ResourceKind } from './handle.js';
import type { PipelineLayoutView } from './pipeline.js';
import { Resource, type ResourceOwner } from './resource.js';
import type { Sampler, Texture } from './texture.js';

export type BindGroupEntryKind = 'uniform' | 'storage' | 'texture' | 'sampler';

export interface BindGroupEntry {
  kind?: BindGroupEntryKind;
  buffer?: Buffer;
  /** 缓冲内起始字节偏移 */
  offset?: number;
  /** 绑定区间字节长度，省略则用整个缓冲 */
  size?: number;
  texture?: Texture;
  sampler?: Sampler;
  /** 显式指定 binding 序号，覆盖自动推导结果 */
  binding?: number;
}

export interface BindGroupDescriptor {
  label?: string;
  /** 从管线声明推导布局和 binding 序号（推荐） */
  pipeline?: PipelineLayoutView;
  /** WebGPU 的 bind group 索引，默认 0 */
  group?: number;
  /** 名称 -> 绑定项。名称对应管线声明里的 uniform 块名 / 纹理名 */
  entries?: Record<string, BindGroupEntry>;
}

export abstract class BindGroup extends Resource {
  readonly group: number;

  protected constructor(owner: ResourceOwner, descriptor: BindGroupDescriptor) {
    super(owner, ResourceKind.BindGroup, descriptor.label ?? 'bindGroup');
    this.group = descriptor.group ?? 0;
  }

  /** 原生对象：WebGPU 为 GPUBindGroup，WebGL 为 null。 */
  abstract get native(): GPUBindGroup | null;

  /** 是否还有未提交的改动。 */
  abstract get dirty(): boolean;

  /** 绑定 uniform 块 / storage 缓冲的数据源。 */
  abstract setBuffer(name: string, buffer: Buffer | null, options?: { offset?: number; size?: number }): void;

  /** 绑定纹理（WebGPU 会同时写入 texture 与 sampler 两个 entry）。 */
  abstract setTexture(name: string, texture: Texture | null, sampler?: Sampler | null): void;

  /** 写入 uniform 块成员的值，等价于 uniformBlock.set() 的快捷入口。 */
  abstract setUniform(name: string, value: UniformValue): void;

  abstract setUniforms(values: Record<string, UniformValue>): void;

  /** 提交所有脏改动（缓冲上传 + 原生绑定对象重建）。设备在绘制前会自动调用。 */
  abstract flush(): void;
}
