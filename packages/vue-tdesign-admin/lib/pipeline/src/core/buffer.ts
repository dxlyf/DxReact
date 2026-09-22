/**
 * 缓冲资源（VBO / EBO / UBO / SSBO）。
 *
 * 三种 API 的缓冲差异被保留在实现里，但共享同一套创建/更新/销毁与脏区间语义：
 *  - WebGL1：gl.bufferData / gl.bufferSubData，Dynamic 走子区间更新，Stream 走 orphaning
 *  - WebGL2：同上，另外可被 UBO 直接绑定
 *  - WebGPU：GPUBuffer + queue.writeBuffer，脏区间合并后一次性提交
 *
 * 使用方只需声明"用途 + 更新频率"，更新策略由实现选择。
 */
import type { DataWriter, UniformValue } from './data.js';
import { BufferRole, ResourceKind } from './handle.js';
import { Resource, type ResourceOwner } from './resource.js';
import { BufferFrequency, BufferUsage, type ShaderDataType } from './types.js';

export interface BufferDescriptor {
  label?: string;
  /** 用途位掩码。决定底层 API 的 usage/binding target */
  usage: BufferUsage;
  /** 角色，用于区分 VBO/EBO/UBO。省略时由 usage 推导 */
  role?: BufferRole;
  /** 字节长度。与 data/count+stride 二选一 */
  size?: number;
  /** 初始数据 */
  data?: ArrayBufferView | ArrayBuffer;
  /** 初始数据的元素个数，与 stride 一起用于推导 size */
  count?: number;
  /** 单元素字节大小（记录跨度） */
  stride?: number;
  /** 更新频率，默认由 usage 推导（Uniform -> Dynamic，其余 Static） */
  frequency?: BufferFrequency;
  /** 是否在创建时就允许写入（WebGPU mappedAtCreation，WebGL 无差别） */
  mappedAtCreation?: boolean;
}

export interface BufferUpdateOptions {
  /** 起始字节偏移，默认 0 */
  offset?: number;
}

export interface BufferRange {
  offset: number;
  /** 字节长度 */
  byteLength: number;
}

/** 由 usage 位掩码推导缓冲角色。 */
export function roleFromUsage(usage: BufferUsage): BufferRole {
  if ((usage & BufferUsage.Index) !== 0) return BufferRole.Index;
  if ((usage & BufferUsage.Uniform) !== 0) return BufferRole.Uniform;
  if ((usage & BufferUsage.Vertex) !== 0) return BufferRole.Vertex;
  return BufferRole.Storage;
}

/** 解析描述符，补齐 size 并做一致性校验。三端实现共用的前置步骤。 */
export function resolveBufferDescriptor(descriptor: BufferDescriptor): {
  size: number;
  role: BufferRole;
  frequency: BufferFrequency;
} {
  const role = descriptor.role ?? roleFromUsage(descriptor.usage);
  const dataBytes = descriptor.data
    ? descriptor.data instanceof ArrayBuffer
      ? descriptor.data.byteLength
      : descriptor.data.byteLength
    : 0;
  let size = descriptor.size ?? dataBytes;
  if (descriptor.count !== undefined && descriptor.stride !== undefined) {
    size = descriptor.count * descriptor.stride;
  }
  if (size <= 0) {
    throw new TypeError(
      `${descriptor.label ?? 'buffer'}: 无法确定缓冲大小，请提供 size、data 或 count+stride 之一`,
    );
  }
  if (size % 4 !== 0) {
    // WebGPU 要求 writeBuffer 的偏移与大小是 4 的倍数；提前对齐，避免运行期才报错
    size = Math.ceil(size / 4) * 4;
  }
  const frequency =
    descriptor.frequency ?? ((descriptor.usage & BufferUsage.Uniform) !== 0 ? BufferFrequency.Dynamic : BufferFrequency.Static);
  return { size, role, frequency };
}

export abstract class Buffer extends Resource {
  readonly usage: BufferUsage;
  readonly role: BufferRole;
  readonly frequency: BufferFrequency;
  /** 缓冲字节长度 */
  readonly size: number;

  /**
   * 单元素字节大小。
   * 索引缓冲据此判断 Uint16/Uint32；顶点缓冲据此得到元素个数。
   */
  readonly elementSize: number;

  /** 是否被显式指定过初始数据（WebGL 侧用于决定是否走 bufferData(null) 预分配） */
  readonly hasInitialData: boolean;

  protected constructor(owner: ResourceOwner, descriptor: BufferDescriptor, kindLabel: string) {
    super(owner, ResourceKind.Buffer, descriptor.label ?? kindLabel);
    const resolved = resolveBufferDescriptor(descriptor);
    this.usage = descriptor.usage;
    this.role = resolved.role;
    this.frequency = resolved.frequency;
    this.size = resolved.size;
    this.elementSize = descriptor.stride ?? 4;
    this.hasInitialData = descriptor.data !== undefined;
  }

  /** 元素个数（size / elementSize）。 */
  get count(): number {
    return Math.floor(this.size / this.elementSize);
  }

  /** 原生句柄：WebGL 为 WebGLBuffer，WebGPU 为 GPUBuffer。 */
  abstract get native(): WebGLBuffer | GPUBuffer;

  /**
   * 写入数据。
   *
   * 便捷之处：不需要区分 bufferData / bufferSubData / writeBuffer，
   * 也不需要记住绑定目标；实现按 frequency 选择策略，并只上传受影响的区间。
   */
  abstract update(data: ArrayBufferView | ArrayBuffer, options?: BufferUpdateOptions): void;

  /** 在指定偏移处写入单个值或向量，内部走类型安全的打包。 */
  abstract updateValue(type: ShaderDataType, values: UniformValue, offset: number): void;

  /**
   * 取得 CPU 侧 staging 写入器（首次调用时惰性分配）。
   *
   * 用它可以把"填一块只改了少数字节的内存"写得非常直观：
   *   buffer.writer().seek(offset).write(F32x4, color);
   *   buffer.flush();
   * 写入区间被自动记录为脏区间，flush 只上传动过的部分。
   */
  abstract writer(): DataWriter;

  /** 标记脏区间。多次标记会合并成最小的连续区间。 */
  abstract markDirty(offset: number, byteLength: number): void;

  /** 当前脏区间；无脏数据返回 null。 */
  abstract get dirtyRange(): BufferRange | null;

  /** 立即上传脏区间。设备在绑定/绘制前会自动调用，通常不需要手动调用。 */
  abstract flush(): void;

  /** 完整写入一份新数据（忽略增量策略），用于整块替换。 */
  abstract replace(data: ArrayBufferView | ArrayBuffer): void;
}
