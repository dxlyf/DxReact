import type { Context } from "./context";
import type { IResource } from "./resource";
import type { BufferDataUsage, BufferTarget } from "./types";

/** 可写入缓冲区的数据源：类型化数组或裸 ArrayBuffer */
export type BufferSource = ArrayBufferView | ArrayBuffer;

/**
 * GPU 缓冲区基类（VBO / IBO / UBO / 像素缓冲等通用封装）
 * - 生命周期跟随 WebGL 上下文：丢失时删除底层对象，恢复时重建
 * - 绑定统一走 Context 的脏值缓存，避免重复 bindBuffer
 */
export class Buffer implements IResource {
    static uid = 0

    isDisposed = false
    readonly uid: number
    ctx: Context
    /** 绑定点，决定 bind() 挂到哪个 target */
    target: BufferTarget
    /** 默认数据使用方式，setData 未显式指定时使用 */
    usage: BufferDataUsage
    buffer: WebGLBuffer | null = null
    /** 最近一次上传的数据字节长度（上下文丢失后归零） */
    byteLength = 0
    /** 最近一次上传的数据源，用于上下文恢复后重传 */
    data: BufferSource | number | null = null

    constructor(ctx: Context, target: BufferTarget = 'ARRAY_BUFFER', usage: BufferDataUsage = 'STATIC_DRAW') {
        this.ctx = ctx
        this.target = target
        this.usage = usage
        this.uid = Buffer.uid++
        this.createBuffer()
        this.ctx.on('contextlost', () => {
            this.deleteBuffer()
            // 上下文丢失后显存内容不可保留
            this.byteLength = 0
        })
        this.ctx.on('contextrestored', () => {
            this.createBuffer()
            // 显存内容已丢失，按原数据源重新分配并上传
            if (this.data !== null) {
                this.setData(this.data, this.usage)
            }
        })
        this.ctx.addDisposable(this)
    }

    protected get gl() {
        return this.ctx.gl
    }

    createBuffer() {
        if (this.buffer !== null) { return }
        this.buffer = this.gl.createBuffer()
    }
    deleteBuffer() {
        if (this.buffer === null) { return }
        this.gl.deleteBuffer(this.buffer)
        this.buffer = null
    }
    bind() {
        this.ctx.bindBuffer(this.target, this.buffer)
    }
    unbind() {
        this.ctx.bindBuffer(this.target, null)
    }
    /** 把缓冲区绑定到带索引的绑定点（UNIFORM_BUFFER / TRANSFORM_FEEDBACK_BUFFER） */
    bindBase(index: number) {
        if (this.target !== 'UNIFORM_BUFFER' && this.target !== 'TRANSFORM_FEEDBACK_BUFFER') {
            console.warn('Buffer.bindBase: target ' + this.target + ' 不支持索引绑定')
            return
        }
        this.ctx.bindBufferBase(this.target, index, this.buffer)
    }
    /**
     * 分配并上传数据
     * @param data 数据源；传 number 表示只分配指定字节数的空间、不写入数据
     */
    setData(data: BufferSource | number, usage: BufferDataUsage = this.usage) {
        this.usage = usage
        this.data = data
        this.bind()
        const gl = this.gl
        if (typeof data === 'number') {
            gl.bufferData(gl[this.target], data, gl[usage])
            this.byteLength = data
        } else {
            gl.bufferData(gl[this.target], data, gl[usage])
            this.byteLength = data.byteLength
        }
    }
    /**
     * 局部更新已分配空间的数据
     * @param offset 目标字节偏移
     */
    setSubData(offset: number, data: BufferSource) {
        this.bind()
        this.gl.bufferSubData(this.gl[this.target], offset, data)
    }
    /** 读取已分配/已上传的字节长度 */
    getSize() {
        return this.byteLength
    }
    dispose(): void {
        if (this.isDisposed) { return }
        this.isDisposed = true
        this.deleteBuffer()
        this.ctx.resources.delete(this)
    }
}

/** 顶点缓冲区：ARRAY_BUFFER */
export class VertexBuffer extends Buffer {
    constructor(ctx: Context, usage: BufferDataUsage = 'STATIC_DRAW') {
        super(ctx, 'ARRAY_BUFFER', usage)
    }
}

/** 索引缓冲区：ELEMENT_ARRAY_BUFFER */
export class IndexBuffer extends Buffer {
    constructor(ctx: Context, usage: BufferDataUsage = 'STATIC_DRAW') {
        super(ctx, 'ELEMENT_ARRAY_BUFFER', usage)
    }
}
