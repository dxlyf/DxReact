import type { Context } from "./context"
import type { ActiveUniformBlockMate, Program } from "./program"
import type { IResource } from "./resource"
import type { BufferDataUsage } from "./types"
import { Buffer } from "./buffer"

/** std140 成员的标量类型 */
export type UniformBlockMemberKind = 'float' | 'int' | 'uint' | 'bool'

/**
 * 解析后的 uniform block 成员布局
 * - 布局数据全部由 GL 提供（getActiveUniforms 返回的 offset / arrayStride / matrixStride），无需自行推导 std140
 * - 标量与向量统一表达为 cols = 1、rows = 分量数；矩阵表达为 cols = 列数、rows = 行数
 */
export type UniformBlockMember = {
    name: string
    kind: UniformBlockMemberKind
    /** 行数：标量为 1，向量为其分量数，矩阵为其行数 */
    rows: number
    /** 列数：标量与向量为 1，矩阵为其列数 */
    cols: number
    /** 数组长度，非数组为 1 */
    count: number
    /** 成员在 block 中的起始字节偏移 */
    offset: number
    /** 数组元素之间的字节步长，非数组为 0 */
    arrayStride: number
    /** 矩阵列之间的字节步长，非矩阵为 0 */
    matrixStride: number
}

/** 可写入 UBO 的值：标量，或按列主序展平的分量序列 */
export type UniformBlockValue = number | boolean | ArrayLike<number | boolean>

export type UniformBlockOptions = {
    /** GLSL 中 block 的名字 */
    name: string
    /** 绑定点，缺省沿用程序链接时分配的 binding */
    binding?: number
    /** 缓冲使用方式，缺省 DYNAMIC_DRAW */
    usage?: BufferDataUsage
}

/**
 * Uniform Block（UBO）封装
 * - 构造时从 Program 读取 block 布局，按 blockSize 分配 ArrayBuffer，并用三个视图共享同一块内存
 * - 写入只改 CPU 端内存并累积脏区间，bind() 时按脏区间一次性 setSubData 上传
 * - 上下文恢复时 Buffer 只重建底层对象、不重新分配存储，因此这里需要回填整块数据
 */
export class UniformBlock implements IResource {
    static uid = 0

    isDisposed = false
    readonly uid: number
    ctx: Context
    /** 所属程序：block 布局与 binding 关联都经由它 */
    program: Program
    /** GLSL 中 block 的名字 */
    name: string
    /** block 在程序中的索引 */
    blockIndex: number
    /** 绑定点：uniformBlockBinding 与 bindBufferBase 使用同一个值 */
    binding: number
    /** block 字节大小（GL 按 std140 计算，含对齐填充） */
    byteLength: number
    usage: BufferDataUsage
    buffer: Buffer
    /** CPU 端整块数据 */
    data: ArrayBuffer
    /** 按成员基础名索引（数组会剥掉 [0] 后缀） */
    members = new Map<string, UniformBlockMember>()

    protected floatView: Float32Array
    protected intView: Int32Array
    protected uintView: Uint32Array
    /** 待上传的字节区间 [dirtyStart, dirtyEnd) */
    protected dirtyStart = Number.MAX_SAFE_INTEGER
    protected dirtyEnd = 0

    constructor(ctx: Context, program: Program, options: UniformBlockOptions) {
        this.ctx = ctx
        this.program = program
        this.uid = UniformBlock.uid++
        this.name = options.name
        this.usage = options.usage ?? 'DYNAMIC_DRAW'
        program.fetchUniformsBlock()
        const block = program.uniformBlocks.get(this.name)
        if (!block) {
            throw new Error(`uniform block ${this.name} not found in program`)
        }
        this.blockIndex = block.blockIndex
        this.binding = options.binding ?? block.binding
        this.byteLength = block.blockSize
        this.data = new ArrayBuffer(this.byteLength)
        this.floatView = new Float32Array(this.data)
        this.intView = new Int32Array(this.data)
        this.uintView = new Uint32Array(this.data)
        this.resolveMembers(block)
        this.buffer = new Buffer(ctx, 'UNIFORM_BUFFER', this.usage)
        // 传 ArrayBuffer 引用，Buffer 会在上下文恢复时按它重新分配并上传整块数据
        this.buffer.setData(this.data, this.usage)
        // 把程序的 block 关联到绑定点，之后 bindBufferBase 才有意义
        program.uniformBlockBinding(this.name, this.binding)
        ctx.addDisposable(this)
    }

    protected get gl() {
        return this.ctx.gl
    }

    protected resolveMembers(block: ActiveUniformBlockMate) {
        for (const member of block.members) {
            const resolved = this.resolveType(member.type)
            if (!resolved) {
                throw new Error(`uniform block member ${member.name} has unsupported type`)
            }
            // 数组以 name[0] 形式返回，剥掉下标作为访问键
            const name = member.name.endsWith('[0]') ? member.name.slice(0, -3) : member.name
            this.members.set(name, {
                name: name,
                kind: resolved.kind,
                rows: resolved.rows,
                cols: resolved.cols,
                count: member.size,
                offset: member.offset,
                arrayStride: member.arrayStride,
                matrixStride: member.matrixStride,
            })
        }
    }
    /** GLenum → 标量类型 + 行列数；采样器等不透明类型不允许出现在 block 中 */
    protected resolveType(type: number): { kind: UniformBlockMemberKind; rows: number; cols: number } | null {
        const gl = this.gl
        switch (type) {
            case gl.FLOAT: return { kind: 'float', rows: 1, cols: 1 }
            case gl.FLOAT_VEC2: return { kind: 'float', rows: 2, cols: 1 }
            case gl.FLOAT_VEC3: return { kind: 'float', rows: 3, cols: 1 }
            case gl.FLOAT_VEC4: return { kind: 'float', rows: 4, cols: 1 }
            case gl.INT: return { kind: 'int', rows: 1, cols: 1 }
            case gl.INT_VEC2: return { kind: 'int', rows: 2, cols: 1 }
            case gl.INT_VEC3: return { kind: 'int', rows: 3, cols: 1 }
            case gl.INT_VEC4: return { kind: 'int', rows: 4, cols: 1 }
            case gl.UNSIGNED_INT: return { kind: 'uint', rows: 1, cols: 1 }
            case gl.UNSIGNED_INT_VEC2: return { kind: 'uint', rows: 2, cols: 1 }
            case gl.UNSIGNED_INT_VEC3: return { kind: 'uint', rows: 3, cols: 1 }
            case gl.UNSIGNED_INT_VEC4: return { kind: 'uint', rows: 4, cols: 1 }
            case gl.BOOL: return { kind: 'bool', rows: 1, cols: 1 }
            case gl.BOOL_VEC2: return { kind: 'bool', rows: 2, cols: 1 }
            case gl.BOOL_VEC3: return { kind: 'bool', rows: 3, cols: 1 }
            case gl.BOOL_VEC4: return { kind: 'bool', rows: 4, cols: 1 }
            case gl.FLOAT_MAT2: return { kind: 'float', rows: 2, cols: 2 }
            case gl.FLOAT_MAT3: return { kind: 'float', rows: 3, cols: 3 }
            case gl.FLOAT_MAT4: return { kind: 'float', rows: 4, cols: 4 }
            // matCxR：C 为列数、R 为行数
            case gl.FLOAT_MAT2x3: return { kind: 'float', rows: 3, cols: 2 }
            case gl.FLOAT_MAT2x4: return { kind: 'float', rows: 4, cols: 2 }
            case gl.FLOAT_MAT3x2: return { kind: 'float', rows: 2, cols: 3 }
            case gl.FLOAT_MAT3x4: return { kind: 'float', rows: 4, cols: 3 }
            case gl.FLOAT_MAT4x2: return { kind: 'float', rows: 2, cols: 4 }
            case gl.FLOAT_MAT4x3: return { kind: 'float', rows: 3, cols: 4 }
            default: return null
        }
    }

    protected requireMember(name: string): UniformBlockMember {
        const member = this.members.get(name)
        if (!member) {
            throw new Error(`uniform block ${this.name} member ${name} not found`)
        }
        return member
    }
    protected flatten(value: UniformBlockValue): ArrayLike<number | boolean> {
        if (typeof value === 'number' || typeof value === 'boolean') {
            return [value]
        }
        return value
    }
    /**
     * 按成员布局写入标量/向量/矩阵/数组
     * - 数组元素 i 位于 offset + i * arrayStride
     * - 矩阵第 c 列位于 offset + c * matrixStride，列内分量连续排列（列主序）
     */
    protected write(member: UniformBlockMember, values: ArrayLike<number | boolean>) {
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
        this.markDirty(member.offset, member.offset + (member.count - 1) * elementStride + (member.cols - 1) * columnStride + member.rows * 4)
    }
    /** 各标量类型在 std140 中都占 4 字节，按字节偏移 / 4 落到对应视图；bool 以 uint32 的 0/1 表示 */
    protected writeComponent(byteOffset: number, kind: UniformBlockMemberKind, value: number | boolean) {
        const index = byteOffset >> 2
        switch (kind) {
            case 'float':
                this.floatView[index] = value as number
                break
            case 'int':
                this.intView[index] = value as number
                break
            case 'uint':
                this.uintView[index] = value as number
                break
            case 'bool':
                this.uintView[index] = value ? 1 : 0
                break
        }
    }
    protected markDirty(start: number, end: number) {
        if (start < this.dirtyStart) {
            this.dirtyStart = start
        }
        if (end > this.dirtyEnd) {
            this.dirtyEnd = end
        }
    }
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
    setUint(name: string, value: number) {
        this.setValue(name, value)
    }
    setBool(name: string, value: boolean) {
        this.setValue(name, value)
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
    setBoolArray(name: string, value: ArrayLike<boolean>) {
        this.setValue(name, value)
    }
    setMat3(name: string, value: ArrayLike<number>) {
        this.setValue(name, value)
    }
    setMat4(name: string, value: ArrayLike<number>) {
        this.setValue(name, value)
    }

    /** 上传脏区间，并把绑定点上的 buffer 换成自己 */
    bind(binding: number = this.binding) {
        this.binding = binding
        this.program.uniformBlockBinding(this.name, binding)
        this.update()
        this.buffer.bindBase(binding)
    }
    /** 按累积的脏区间做一次局部上传 */
    update() {
        if (this.dirtyStart >= this.dirtyEnd) {
            return
        }
        const start = this.dirtyStart
        const end = this.dirtyEnd
        this.dirtyStart = Number.MAX_SAFE_INTEGER
        this.dirtyEnd = 0
        this.buffer.setSubData(start, new Uint8Array(this.data, start, end - start))
    }

    dispose(): void {
        if (this.isDisposed) {
            return
        }
        this.isDisposed = true
        this.buffer.dispose()
        this.members.clear()
        this.ctx.resources.delete(this)
    }
}
