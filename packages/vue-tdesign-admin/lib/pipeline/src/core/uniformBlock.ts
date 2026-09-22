/**
 * uniform 块资源（std140 布局的 uniform 组）。
 *
 * 差异保留：
 *  - WebGL2：原生 UBO。getUniformBlockIndex + uniformBlockBinding 绑定到 UBO 槽位，
 *    数据经 gl.bufferSubData 上传，绘制时一次 bindBufferBase 生效。
 *  - WebGPU：原生 uniform buffer，作为 bind group 的一个 entry；
 *    数据写入 staging 后由 queue.writeBuffer 按脏区间提交。
 *  - WebGL1：没有 UBO。此时 UniformBlock 会降级为"逐成员 uniform 上传"，
 *    buffer 为 null；这一降级是显式的、可探测的（capabilities.uniformBuffers === false），
 *    不隐藏原始差异。
 *
 * 三种情况下布局都由同一份 std140 推导结果决定，因此 uniform 块的声明只需写一次。
 */
import type { Buffer } from './buffer.js';
import {
  computeStd140Layout,
  type Std140Layout,
  type Std140MemberLayout,
  type UniformBlockMember,
  type UniformValue,
} from './data.js';
import { ResourceKind } from './handle.js';
import { Resource, type ResourceOwner } from './resource.js';
import { BufferFrequency, ShaderDataType } from './types.js';

export type UniformBlockMembers =
  | readonly UniformBlockMember[]
  | Record<string, ShaderDataType | { type: ShaderDataType; count?: number }>;

export interface UniformBlockDescriptor {
  name: string;
  members: UniformBlockMembers;
  /** WebGL2 的 block binding / WebGPU 的 bind group 内 binding */
  binding?: number;
  /** WebGPU 的 bind group 索引，默认 0 */
  group?: number;
  frequency?: BufferFrequency;
  /** 覆盖自动推导的字节大小 */
  size?: number;
  label?: string;
}

/** 把字面量写法归一成成员数组。 */
export function normalizeBlockMembers(members: UniformBlockMembers): UniformBlockMember[] {
  if (Array.isArray(members)) return [...members] as UniformBlockMember[];
  return Object.entries(members as Record<string, ShaderDataType | { type: ShaderDataType; count?: number }>).map(
    ([name, value]) => {
      if (typeof value === 'string') return { name, type: value };
      return { name, type: value.type, count: value.count };
    },
  );
}

export abstract class UniformBlock extends Resource {
  readonly name: string;
  readonly layout: Std140Layout;
  readonly binding: number;
  readonly group: number;
  readonly size: number;
  readonly frequency: BufferFrequency;

  protected constructor(owner: ResourceOwner, descriptor: UniformBlockDescriptor) {
    super(owner, ResourceKind.UniformBlock, descriptor.label ?? descriptor.name);
    if (!descriptor.name) throw new TypeError('UniformBlockDescriptor.name 不能为空');
    this.name = descriptor.name;
    this.layout = computeStd140Layout(normalizeBlockMembers(descriptor.members));
    this.binding = descriptor.binding ?? 0;
    this.group = descriptor.group ?? 0;
    this.size = descriptor.size ?? this.layout.size;
    this.frequency = descriptor.frequency ?? BufferFrequency.Dynamic;
  }

  /** 成员布局查询。 */
  member(name: string): Std140MemberLayout | undefined {
    return this.layout.byName.get(name);
  }

  /** 成员的字节偏移，写错名字时直接抛错而不是静默无效。 */
  byteOffsetOf(name: string): number {
    const member = this.member(name);
    if (!member) {
      throw new TypeError(
        `${this.describe()}: 不存在成员 ${name}；可用成员: ${[...this.layout.byName.keys()].join(', ')}`,
      );
    }
    return member.offset;
  }

  /**
   * 后备缓冲。
   * WebGL2 / WebGPU 返回真实 UBO，WebGL1 降级模式下返回 null。
   */
  abstract get buffer(): Buffer | null;

  /** 是否处于降级模式（逐成员 uniform 上传）。 */
  abstract get degraded(): boolean;

  abstract get dirty(): boolean;

  /** 设置单个成员的值，自动按 std140 偏移写入并把所在区间标记为脏。 */
  abstract set(member: string, value: UniformValue): void;

  /** 批量设置成员；同一次调用只产生一个合并后的脏区间。 */
  abstract setMany(values: Record<string, UniformValue>): void;

  /** 立即提交脏区间。设备在绘制前会自动调用。 */
  abstract flush(): void;
}
