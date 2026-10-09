import type { Device } from "./device";
import type { IResource } from "./resource";
import { Buffer } from "./buffer";

/**
 * Uniform Block（WGSL uniform 缓冲的结构体）封装
 * WebGPU 里 uniform 缓冲必须与 WGSL 结构体严格按 std140 对齐，手算 offset/stride 极易出错。
 * 本类用声明式成员表自动推导对齐、偏移与总大小，并把「改值 → 累积脏区间 → 增量上传」封装起来。
 */

/** 支持的成员类型：标量 / 向量 / 矩阵（矩阵写作 matCxRf，C 为列数、R 为行数） */
export type UniformMemberType =
    | 'f32' | 'vec2f' | 'vec3f' | 'vec4f'
    | 'i32' | 'vec2i' | 'vec3i' | 'vec4i'
    | 'u32' | 'vec2u' | 'vec3u' | 'vec4u'
    | 'mat2x2f' | 'mat2x3f' | 'mat2x4f'
    | 'mat3x2f' | 'mat3x3f' | 'mat3x4f'
    | 'mat4x2f' | 'mat4x3f' | 'mat4x4f'

/** 内存布局规则：std140 用于 uniform 缓冲，std430 用于 storage 缓冲 */
export type UniformLayout = 'std140' | 'std430'

/** 成员声明 */
export interface UniformBlockMemberDesc {
    name: string
    type: UniformMemberType
    /** 数组长度，非数组留空或填 1 */
    count?: number
}

export interface UniformBlockOptions {
    members: UniformBlockMemberDesc[]
    /** 对齐规则，缺省 std140 */
    layout?: UniformLayout
    label?: string
}

/** 解析后的成员布局 */
export interface ResolvedUniformMember {
    name: string
    type: UniformMemberType
    /** 分量基类型 */
    kind: 'f32' | 'i32' | 'u32'
    /** 行数：标量为 1，向量为分量数，矩阵为行数 */
    rows: number
    /** 列数：标量与向量为 1，矩阵为列数 */
    cols: number
    /** 数组长度，非数组为 1 */
    count: number
    /** 成员起始字节偏移 */
    offset: number
    /** 数组元素间字节步长，非数组为 0 */
    arrayStride: number
    /** 矩阵列间字节步长，非矩阵为 0 */
    matrixStride: number
}

/** 按类型拆出基类型与行列数 */
function parseType(type: UniformMemberType): { kind: 'f32' | 'i32' | 'u32'; cols: number; rows: number } {
    switch (type) {
        case 'f32': return { kind: 'f32', cols: 1, rows: 1 }
        case 'vec2f': return { kind: 'f32', cols: 1, rows: 2 }
        case 'vec3f': return { kind: 'f32', cols: 1, rows: 3 }
        case 'vec4f': return { kind: 'f32', cols: 1, rows: 4 }
        case 'i32': return { kind: 'i32', cols: 1, rows: 1 }
        case 'vec2i': return { kind: 'i32', cols: 1, rows: 2 }
        case 'vec3i': return { kind: 'i32', cols: 1, rows: 3 }
        case 'vec4i': return { kind: 'i32', cols: 1, rows: 4 }
        case 'u32': return { kind: 'u32', cols: 1, rows: 1 }
        case 'vec2u': return { kind: 'u32', cols: 1, rows: 2 }
        case 'vec3u': return { kind: 'u32', cols: 1, rows: 3 }
        case 'vec4u': return { kind: 'u32', cols: 1, rows: 4 }
        case 'mat2x2f': return { kind: 'f32', cols: 2, rows: 2 }
        case 'mat2x3f': return { kind: 'f32', cols: 2, rows: 3 }
        case 'mat2x4f': return { kind: 'f32', cols: 2, rows: 4 }
        case 'mat3x2f': return { kind: 'f32', cols: 3, rows: 2 }
        case 'mat3x3f': return { kind: 'f32', cols: 3, rows: 3 }
        case 'mat3x4f': return { kind: 'f32', cols: 3, rows: 4 }
        case 'mat4x2f': return { kind: 'f32', cols: 4, rows: 2 }
        case 'mat4x3f': return { kind: 'f32', cols: 4, rows: 3 }
        case 'mat4x4f': return { kind: 'f32', cols: 4, rows: 4 }
    }
}

/** 列向量（含标量）的对齐与大小 */
function vectorSpec(rows: number): { align: number; size: number } {
    switch (rows) {
        case 1: return { align: 4, size: 4 }
        case 2: return { align: 8, size: 8 }
        case 3: return { align: 16, size: 12 }
        default: return { align: 16, size: 16 }
    }
}

function align(offset: number, alignment: number): number {
    return alignment <= 1 ? offset : Math.ceil(offset / alignment) * alignment
}

/** 推导整个 block 的成员偏移与总字节大小 */
function resolveLayout(descs: UniformBlockMemberDesc[], layout: UniformLayout): { members: Map<string, ResolvedUniformMember>; byteLength: number } {
    const members = new Map<string, ResolvedUniformMember>()
    let offset = 0
    let structAlign = 1
    for (const desc of descs) {
        const info = parseType(desc.type)
        const count = desc.count ?? 1
        const column = vectorSpec(info.rows)
        const isMatrix = info.cols > 1
        const matrixStride = isMatrix
            ? (layout === 'std140' ? align(column.size, 16) : align(column.size, column.align))
            : 0
        const elementSize = isMatrix ? (info.cols - 1) * matrixStride + column.size : column.size
        // 数组：std140 下元素对齐与步长都要上取整到 16
        const memberAlign = count > 1
            ? (layout === 'std140' ? align(column.align, 16) : column.align)
            : column.align
        const arrayStride = count > 1
            ? (layout === 'std140' ? align(elementSize, 16) : align(elementSize, column.align))
            : 0
        offset = align(offset, memberAlign)
        structAlign = Math.max(structAlign, memberAlign)
        members.set(desc.name, {
            name: desc.name,
            type: desc.type,
            kind: info.kind,
            rows: info.rows,
            cols: info.cols,
            count,
            offset,
            arrayStride,
            matrixStride,
        })
        offset += count > 1 ? (count - 1) * arrayStride + elementSize : elementSize
    }
    if (layout === 'std140') {
        structAlign = align(structAlign, 16)
    }
    return { members, byteLength: align(offset, structAlign) }
}

/** 可写入的值：标量，或按列主序展平的分量序列 */
export type UniformBlockValue = number | ArrayLike<number>

export class UniformBlock implements IResource {
    static uid = 0

    isDisposed = false
    readonly uid: number
    device: Device
    /** 布局规则 */
    readonly layout: UniformLayout
    /** block 字节大小（含对齐填充） */
    readonly byteLength: number
    /** 承载数据的 GPU 缓冲 */
    buffer: Buffer
    /** CPU 端整块内存 */
    data: ArrayBuffer
    /** 按成员名索引的布局 */
    members: Map<string, ResolvedUniformMember>

    protected floatView: Float32Array
    protected intView: Int32Array
    protected uintView: Uint32Array
    /** 待上传的字节区间 [dirtyStart, dirtyEnd) */
    protected dirtyStart = Number.MAX_SAFE_INTEGER
    protected dirtyEnd = 0

    constructor(device: Device, options: UniformBlockOptions) {
        this.device = device
        this.uid = UniformBlock.uid++
        this.layout = options.layout ?? 'std140'
        const resolved = resolveLayout(options.members, this.layout)
        this.members = resolved.members
        // 空 block 或极小 block 也要给出合法的非零大小
        this.byteLength = Math.max(resolved.byteLength, 16)
        this.data = new ArrayBuffer(this.byteLength)
        this.floatView = new Float32Array(this.data)
        this.intView = new Int32Array(this.data)
        this.uintView = new Uint32Array(this.data)
        this.buffer = new Buffer(device, {
            size: this.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            label: options.label ?? `uniform-block-${this.uid}`,
        })
        device.addDisposable(this)
    }

    protected requireMember(name: string): ResolvedUniformMember {
        const member = this.members.get(name)
        if (!member) {
            throw new Error(`uniform block member ${name} not found`)
        }
        return member
    }
    protected flatten(value: UniformBlockValue): ArrayLike<number> {
        return typeof value === 'number' ? [value] : value
    }
    /** 按字节偏移写入单个分量；bool 场景用 u32 的 0/1 表达 */
    protected writeComponent(byteOffset: number, kind: 'f32' | 'i32' | 'u32', value: number) {
        const index = byteOffset >> 2
        switch (kind) {
            case 'f32': this.floatView[index] = value; break
            case 'i32': this.intView[index] = value; break
            case 'u32': this.uintView[index] = value; break
        }
    }
    /**
     * 按成员布局写入标量/向量/矩阵/数组
     * - 数组元素 i 位于 offset + i * arrayStride
     * - 矩阵第 c 列位于 offset + c * matrixStride，列内分量连续（列主序）
     */
    protected write(member: ResolvedUniformMember, values: ArrayLike<number>) {
        const perElement = member.rows * member.cols
        const total = perElement * member.count
        if (values.length !== total) {
            throw new Error(`uniform block member ${member.name} expects ${total} values, got ${values.length}`)
        }
        const columnStride = member.cols > 1 ? member.matrixStride : 4
        const elementStride = member.count > 1 ? member.arrayStride : 0
        let valueIndex = 0
        for (let i = 0; i < member.count; i++) {
            const elementOffset = member.offset + i * elementStride
            for (let c = 0; c < member.cols; c++) {
                const columnOffset = elementOffset + c * columnStride
                for (let r = 0; r < member.rows; r++) {
                    this.writeComponent(columnOffset + r * 4, member.kind, values[valueIndex++])
                }
            }
        }
        this.markDirty(
            member.offset,
            member.offset + (member.count - 1) * elementStride + (member.cols - 1) * columnStride + member.rows * 4,
        )
    }
    protected markDirty(start: number, end: number) {
        if (start < this.dirtyStart) {
            this.dirtyStart = start
        }
        if (end > this.dirtyEnd) {
            this.dirtyEnd = end
        }
    }
    /** 标记整块为脏，触发全量上传 */
    markAllDirty() {
        this.dirtyStart = 0
        this.dirtyEnd = this.byteLength
    }

    setValue(name: string, value: UniformBlockValue) {
        this.write(this.requireMember(name), this.flatten(value))
    }
    setFloat(name: string, value: number) {
        this.setValue(name, value)
    }
    setVec2(name: string, x: number, y: number) {
        this.setValue(name, [x, y])
    }
    setVec3(name: string, x: number, y: number, z: number) {
        this.setValue(name, [x, y, z])
    }
    setVec4(name: string, x: number, y: number, z: number, w: number) {
        this.setValue(name, [x, y, z, w])
    }
    setInt(name: string, value: number) {
        this.setValue(name, value)
    }
    setVec2i(name: string, x: number, y: number) {
        this.setValue(name, [x, y])
    }
    setVec3i(name: string, x: number, y: number, z: number) {
        this.setValue(name, [x, y, z])
    }
    setVec4i(name: string, x: number, y: number, z: number, w: number) {
        this.setValue(name, [x, y, z, w])
    }
    setUint(name: string, value: number) {
        this.setValue(name, value)
    }
    setVec2u(name: string, x: number, y: number) {
        this.setValue(name, [x, y])
    }
    setVec3u(name: string, x: number, y: number, z: number) {
        this.setValue(name, [x, y, z])
    }
    setVec4u(name: string, x: number, y: number, z: number, w: number) {
        this.setValue(name, [x, y, z, w])
    }
    /** 矩阵与数组按列主序展平传入 */
    setFloatArray(name: string, value: ArrayLike<number>) {
        this.setValue(name, value)
    }
    setIntArray(name: string, value: ArrayLike<number>) {
        this.setValue(name, value)
    }
    setUintArray(name: string, value: ArrayLike<number>) {
        this.setValue(name, value)
    }
    setMat2(name: string, value: ArrayLike<number>) {
        this.setValue(name, value)
    }
    setMat3(name: string, value: ArrayLike<number>) {
        this.setValue(name, value)
    }
    setMat4(name: string, value: ArrayLike<number>) {
        this.setValue(name, value)
    }

    /** 按累积的脏区间做一次局部上传（无脏数据时跳过） */
    update() {
        if (this.dirtyStart >= this.dirtyEnd) {
            return
        }
        const start = this.dirtyStart
        const end = this.dirtyEnd
        this.dirtyStart = Number.MAX_SAFE_INTEGER
        this.dirtyEnd = 0
        this.buffer.write(new Uint8Array(this.data, start, end - start), start)
    }
    /** 上传脏数据并返回可直接放进 bind group entry 的绑定 */
    getBinding(): GPUBufferBinding {
        this.update()
        return { buffer: this.buffer.buffer, offset: 0, size: this.byteLength }
    }

    dispose(): void {
        if (this.isDisposed) {
            return
        }
        this.isDisposed = true
        this.buffer.dispose()
        this.members.clear()
        this.device.resources.delete(this)
    }
}
