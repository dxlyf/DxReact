/**
 * 数据传输与更新模块的公共底座。
 *
 * 包含三部分：
 *  1. 统一的值校验与打包：把 number / number[] / TypedArray 统一成紧密排列的 TypedArray，
 *     并在类型不符时立刻抛出 TypeMismatch（这是"类型安全的数据绑定"的落点）。
 *  2. DataWriter：带偏移游标的 CPU 侧写入器，用来手写顶点数据、uniform 数组、
 *     std140 uniform 块内容。
 *  3. std140 布局推导：由 UniformBlock 声明直接算出每个成员的偏移与块总大小，
 *     WebGL2 的 UBO 与 WebGPU 的 uniform buffer 共用同一份布局结果。
 */
import { invalidDescriptor, typeMismatch } from './errors.js';
import {
  byteSize,
  componentCount,
  isFloatType,
  isMatrixType,
  matrixColumns,
  ShaderDataType,
} from './types.js';

export type UniformValue =
  | number
  | boolean
  | readonly number[]
  | Float32Array
  | Int32Array
  | Uint32Array;

export type PackedValue = Float32Array | Int32Array | Uint32Array;

/** 向上取整到 alignment 的倍数。 */
export function roundUp(value: number, alignment: number): number {
  return Math.ceil(value / alignment) * alignment;
}

function toNumbers(value: UniformValue, where: string): readonly number[] {
  if (typeof value === 'number') return [value];
  if (typeof value === 'boolean') return [value ? 1 : 0];
  if (Array.isArray(value) || ArrayBuffer.isView(value)) return value as readonly number[];
  throw typeMismatch(`${where}: 无法识别的值类型 ${typeof value}`, { hint: '请传 number、number[] 或 TypedArray。' });
}

/**
 * 校验并打包 uniform 值。
 *
 * 校验规则（与三种 API 的 uniform 语义对齐）：
 *  - 标量类型接受单个数或长度 1 的数组
 *  - 向量/矩阵接受长度为"分量数 × count"的紧密数组（列主序）
 *  - 浮点与矩阵类型打包为 Float32Array；有符号整型打包为 Int32Array；无符号与归一化整型打包为 Uint32Array
 *
 * @param count 数组元素个数（`uniform vec4 u[4]` 传 4），默认 1
 */
export function packUniformValue(
  type: ShaderDataType,
  value: UniformValue,
  count: number,
  where: string,
): PackedValue {
  const numbers = toNumbers(value, where);
  const per = componentCount(type);
  const expected = per * count;
  if (numbers.length !== expected) {
    throw typeMismatch(
      `${where}: ${type}${count > 1 ? `[${count}]` : ''} 需要 ${expected} 个分量，实际收到 ${numbers.length} 个`,
      { hint: isMatrixType(type) ? '矩阵按列主序展开为一维数组。' : undefined },
    );
  }

  if (isFloatType(type) || isMatrixType(type) || type.startsWith('u8') || type.startsWith('u16')) {
    const packed = new Float32Array(numbers);
    return packed;
  }
  if (type.startsWith('i32')) return new Int32Array(numbers);
  return new Uint32Array(numbers);
}

/** 精确比较两份打包数据，供 uniform 冗余赋值跳过使用。 */
export function packedEquals(a: PackedValue | undefined, b: PackedValue): boolean {
  if (!a || a.length !== b.length) return false;
  for (let i = 0; i < b.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * CPU 侧数据写入器。
 *
 * 用游标 + 显式 seek 的方式把"填一块内存"这件事变得可读：
 *   writer.seek(layout.members[1].offset).write(ShaderDataType.F32x4, color);
 */
export class DataWriter {
  readonly buffer: ArrayBuffer;
  readonly view: DataView;
  readonly f32: Float32Array;
  readonly u32: Uint32Array;
  readonly i32: Int32Array;
  readonly u8: Uint8Array;
  readonly f16: Uint16Array;
  /** 当前写入位置（字节） */
  offset = 0;
  /** 已写入的最高位置（字节），用于计算上传区间 */
  limit = 0;

  constructor(source: number | ArrayBuffer) {
    const buffer = typeof source === 'number' ? new ArrayBuffer(source) : source;
    this.buffer = buffer;
    this.view = new DataView(buffer);
    this.u8 = new Uint8Array(buffer);
    this.u32 = new Uint32Array(buffer);
    this.i32 = new Int32Array(buffer);
    this.f32 = new Float32Array(buffer);
    this.f16 = new Uint16Array(buffer);
  }

  get byteLength(): number {
    return this.buffer.byteLength;
  }

  reset(): this {
    this.offset = 0;
    this.limit = 0;
    return this;
  }

  /** 移动游标。越界立刻报错，而不是静默写坏相邻数据。 */
  seek(offset: number): this {
    if (offset < 0 || offset > this.buffer.byteLength) {
      throw invalidDescriptor(`DataWriter.seek(${offset}) 越界，缓冲上限 ${this.buffer.byteLength} 字节`);
    }
    this.offset = offset;
    return this;
  }

  skip(bytes: number): this {
    return this.seek(this.offset + bytes);
  }

  /** 按类型紧密写入，不加 std140 填充。 */
  write(type: ShaderDataType, value: UniformValue, count = 1): this {
    const packed = packUniformValue(type, value, count, 'DataWriter.write');
    this.writeRaw(packed, type);
    return this;
  }

  /** 按 std140 布局写入单个成员（自动跳到成员偏移）。 */
  writeMember(layout: Std140MemberLayout, value: UniformValue): this {
    this.seek(layout.offset);
    if (layout.count > 1) {
      const stride = layout.arrayStride;
      const numbers = toNumbers(value, 'DataWriter.writeMember');
      const per = componentCount(layout.type);
      if (numbers.length !== per * layout.count) {
        throw typeMismatch(
          `DataWriter.writeMember(${layout.name}): 需要 ${per * layout.count} 个分量，实际 ${numbers.length}`,
        );
      }
      for (let i = 0; i < layout.count; i++) {
        this.seek(layout.offset + i * stride);
        this.write(layout.type, numbers.slice(i * per, (i + 1) * per));
      }
      this.seek(layout.offset + stride * (layout.count - 1) + packedElementSize(layout.type));
    } else {
      this.write(layout.type, value);
    }
    return this;
  }

  /** 直接写入一段已打包数据。 */
  writeRaw(packed: ArrayLike<number>, type: ShaderDataType): this {
    const end = this.offset + packed.length * elementByteSize(type);
    if (end > this.buffer.byteLength) {
      throw invalidDescriptor(
        `DataWriter 写入越界: 需要 ${end} 字节，缓冲仅 ${this.buffer.byteLength} 字节`,
        { hint: '检查 UniformBlock 声明的大小是否与分配的一致。' },
      );
    }
    const aligned = this.offset % elementByteSize(type) === 0;
    if (aligned && (type === ShaderDataType.F32 || type === ShaderDataType.F32x2 || type === ShaderDataType.F32x3 || type === ShaderDataType.F32x4 || isMatrixType(type))) {
      this.f32.set(packed as ArrayLike<number>, this.offset / 4);
    } else {
      for (let i = 0; i < packed.length; i++) {
        const at = this.offset + i * elementByteSize(type);
        this.writeOne(at, type, packed[i]);
      }
    }
    this.offset = end;
    if (end > this.limit) this.limit = end;
    return this;
  }

  writeF32(value: number): this {
    this.f32[this.offset >> 2] = value;
    return this.advance(4);
  }

  writeU32(value: number): this {
    this.u32[this.offset >> 2] = value >>> 0;
    return this.advance(4);
  }

  writeI32(value: number): this {
    this.i32[this.offset >> 2] = value | 0;
    return this.advance(4);
  }

  /** 半精度写入。浏览器支持 DataView.setFloat16 时直接用，否则走手算回退。 */
  writeF16(value: number): this {
    const setFloat16 = (this.view as DataView & { setFloat16?: (o: number, v: number) => void }).setFloat16;
    if (typeof setFloat16 === 'function') {
      setFloat16.call(this.view, this.offset, value);
    } else {
      this.f16[this.offset >> 1] = floatToHalf(value);
    }
    return this.advance(2);
  }

  /** 已写入区间（从 0 到 limit）。 */
  writtenBytes(): ArrayBuffer {
    return this.buffer.slice(0, this.limit);
  }

  private advance(bytes: number): this {
    this.offset += bytes;
    if (this.offset > this.limit) this.limit = this.offset;
    return this;
  }

  private writeOne(byteOffset: number, type: ShaderDataType, value: number): void {
    switch (type) {
      case ShaderDataType.U8x2:
      case ShaderDataType.U8x4:
        this.u8[byteOffset] = value;
        return;
      case ShaderDataType.U16x2:
      case ShaderDataType.U16x4:
        this.view.setUint16(byteOffset, value & 0xffff, true);
        return;
      case ShaderDataType.F16x2:
      case ShaderDataType.F16x4:
        this.view.setUint16(byteOffset, floatToHalf(value), true);
        return;
      case ShaderDataType.I32x2:
      case ShaderDataType.I32x3:
      case ShaderDataType.I32x4:
      case ShaderDataType.I32:
        this.view.setInt32(byteOffset, value | 0, true);
        return;
      case ShaderDataType.U32:
      case ShaderDataType.U32x2:
      case ShaderDataType.U32x3:
      case ShaderDataType.U32x4:
        this.view.setUint32(byteOffset, value >>> 0, true);
        return;
      default:
        this.view.setFloat32(byteOffset, value, true);
    }
  }
}

/** 单个元素的字节大小（不含 std140 填充）。 */
export function elementByteSize(type: ShaderDataType): number {
  return byteSize(type) / componentCount(type);
}

function packedElementSize(type: ShaderDataType): number {
  if (isMatrixType(type)) {
    // 矩阵在 std140 中按"列"展开，列占 4 字节
    return matrixColumns(type) * 16;
  }
  return byteSize(type);
}

const halfScratchF32 = new Float32Array(1);
const halfScratchI32 = new Int32Array(halfScratchF32.buffer);

/** 半精度转换回退实现（浏览器无 DataView.setFloat16 时使用）。 */
export function floatToHalf(value: number): number {
  halfScratchF32[0] = value;
  const x = halfScratchI32[0];
  const sign = (x >> 16) & 0x8000;
  const exponent = (x >> 23) & 0xff;
  let mantissa = x & 0x007fffff;

  // NaN / Infinity
  if (exponent === 0xff) return sign | 0x7c00 | (mantissa ? 0x0200 : 0);

  const e = exponent - 127 + 15;
  if (e >= 0x1f) return sign | 0x7c00;

  if (e <= 0) {
    if (e < -10) return sign;
    // 次正规数：补上隐含位后右移
    mantissa |= 0x00800000;
    const shift = 14 - e;
    let half = mantissa >> shift;
    if ((mantissa >> (shift - 1)) & 1) half += 1;
    return sign | half;
  }

  let half = (e << 10) | (mantissa >> 13);
  if (mantissa & 0x00001000) half += 1; // 就近舍入
  return sign | half;
}

// ---------------------------------------------------------------------------
// std140 布局
// ---------------------------------------------------------------------------

export interface UniformBlockMember {
  name: string;
  type: ShaderDataType;
  /** 数组元素个数，默认 1 */
  count?: number;
}

export interface Std140MemberLayout {
  name: string;
  type: ShaderDataType;
  /** 相对块起始的字节偏移 */
  offset: number;
  /** 单个元素的字节大小 */
  size: number;
  count: number;
  /** 数组元素步长（非数组时等于 size 向上对齐到 16） */
  arrayStride: number;
  /** 成员占用的总字节（含数组） */
  byteSize: number;
}

export interface Std140Layout {
  /** 块总大小，已对齐到 16 字节 */
  size: number;
  members: Std140MemberLayout[];
  /** 名称 -> 成员布局，便于按名写入 */
  byName: Map<string, Std140MemberLayout>;
}

function memberAlign(type: ShaderDataType): number {
  switch (type) {
    case ShaderDataType.F32:
    case ShaderDataType.I32:
    case ShaderDataType.U32:
      return 4;
    case ShaderDataType.F32x2:
    case ShaderDataType.I32x2:
    case ShaderDataType.U32x2:
      return 8;
    default:
      return 16;
  }
}

function memberPackedSize(type: ShaderDataType): number {
  if (isMatrixType(type)) {
    // std140 中矩阵的每一列占一个 vec4 槽位
    return matrixColumns(type) * 16;
  }
  switch (type) {
    case ShaderDataType.F32:
    case ShaderDataType.I32:
    case ShaderDataType.U32:
      return 4;
    case ShaderDataType.F32x2:
    case ShaderDataType.I32x2:
    case ShaderDataType.U32x2:
      return 8;
    case ShaderDataType.F32x3:
    case ShaderDataType.I32x3:
    case ShaderDataType.U32x3:
      return 12;
    case ShaderDataType.F32x4:
    case ShaderDataType.I32x4:
    case ShaderDataType.U32x4:
      return 16;
    default:
      throw invalidDescriptor(
        `std140 布局不支持类型 ${type}`,
        { hint: '8/16 位整型在 std140 中必须按 4 字节对齐，请改用 I32/U32 或 F32。' },
      );
  }
}

/**
 * 由声明推导 std140 布局。
 *
 * WebGL2 的 UBO 与 WebGPU 的 uniform buffer 都遵循 std140 对齐规则，
 * 因此同一份声明可以直接生成两侧的缓冲布局，不需要为后端各写一套。
 */
export function computeStd140Layout(members: readonly UniformBlockMember[]): Std140Layout {
  const result: Std140MemberLayout[] = [];
  const byName = new Map<string, Std140MemberLayout>();
  let offset = 0;

  for (const member of members) {
    const count = member.count ?? 1;
    if (count < 1) throw invalidDescriptor(`UniformBlock 成员 ${member.name} 的 count 必须 >= 1`);
    const align = memberAlign(member.type);
    const packed = memberPackedSize(member.type);
    // 数组步长：元素大小向上对齐到 16；非数组成员步长取对齐后的元素大小
    const stride = count > 1 ? roundUp(packed, 16) : roundUp(packed, align);
    offset = roundUp(offset, align);
    const layout: Std140MemberLayout = {
      name: member.name,
      type: member.type,
      offset,
      size: packed,
      count,
      arrayStride: stride,
      byteSize: count > 1 ? stride * count : packed,
    };
    result.push(layout);
    byName.set(member.name, layout);
    offset += layout.byteSize;
  }

  return { size: roundUp(offset, 16), members: result, byName };
}

/** 便捷构造：由 `{ name: type }` 字面量生成布局。 */
export function layoutOf(members: readonly UniformBlockMember[]): Std140Layout {
  return computeStd140Layout(members);
}
