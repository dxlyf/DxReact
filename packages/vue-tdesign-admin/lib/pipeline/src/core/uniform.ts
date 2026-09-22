/**
 * uniform 资源。
 *
 * 差异保留：
 *  - WebGL：uniform 有 location，赋值走 uniform1f/uniform3fv/uniformMatrix4fv 等，
 *    需要按类型选对调用。本对象把这层选择做掉，并缓存上一次的值以跳过冗余赋值。
 *  - WebGPU：不存在独立 uniform，值写进 uniform buffer 的指定偏移。
 *    本对象退化为"staging 里的一个槽位 + 脏标记"，由 BindGroup.flush 统一提交。
 *
 * 两端因此共享同一套用户代码：pipeline.setUniform('uColor', [1,0,0,1])。
 */
import type { PackedValue, UniformValue } from './data.js';
import { ResourceKind } from './handle.js';
import { Resource, type ResourceOwner } from './resource.js';
import { componentCount, isFloatType, isMatrixType, ShaderDataType } from './types.js';

export interface UniformDescriptor {
  name: string;
  type: ShaderDataType;
  /** 数组元素个数，`uniform vec4 u[4]` 传 4 */
  count?: number;
  /** 显式指定 location（WebGL）；WebGPU 下忽略 */
  location?: number;
}

export abstract class Uniform extends Resource {
  readonly name: string;
  readonly type: ShaderDataType;
  readonly count: number;

  protected constructor(owner: ResourceOwner, descriptor: UniformDescriptor) {
    super(owner, ResourceKind.Uniform, descriptor.name);
    this.name = descriptor.name;
    this.type = descriptor.type;
    this.count = descriptor.count ?? 1;
  }

  /** 值域的元素个数（数组 uniform 为 分量数 × count） */
  get componentTotal(): number {
    return componentCount(this.type) * this.count;
  }

  get isArray(): boolean {
    return this.count > 1;
  }

  get isMatrix(): boolean {
    return isMatrixType(this.type);
  }

  get isFloat(): boolean {
    return isFloatType(this.type) || isMatrixType(this.type);
  }

  /** WebGL 的 uniform location；WebGPU 下为 staging 偏移（无独立 location 语义）。 */
  abstract get location(): number;

  /** 是否还有未提交的改动。 */
  abstract get dirty(): boolean;

  /** 已打包的值，未设置过时为 undefined。 */
  abstract get value(): PackedValue | undefined;

  /**
   * 设置值。类型不符会立刻抛 TypeMismatch；
   * 与上次值完全相同时会被跳过（uniform 脏标记），并计入 stats.uniformSkips。
   */
  abstract set(value: UniformValue): void;

  /** 强制下次提交时重新赋值。 */
  abstract markDirty(): void;
}
