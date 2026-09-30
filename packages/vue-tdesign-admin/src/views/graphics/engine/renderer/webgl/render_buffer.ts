import type { Context } from "./context"
import type { IResource } from "./resource"
import type { TextureInternalFormat } from "./types"

/** 渲染缓冲的存储参数 */
export type RenderBufferStorageOptions = {
    /** 显存内部格式，深度/模板类如 DEPTH_COMPONENT16、DEPTH24_STENCIL8 */
    internalFormat?: TextureInternalFormat
    /** 多重采样样本数，>1 时走 renderbufferStorageMultisample */
    samples?: number
}

/**
 * 渲染缓冲（RenderBuffer）
 * 通常作为帧缓冲的深度/模板附件使用；与纹理不同，它不能被着色器采样。
 * 生命周期跟随 WebGL 上下文：丢失时删除底层对象，恢复时重建并重新分配存储。
 */
export class RenderBuffer implements IResource {
    static uid = 0

    isDisposed = false
    readonly uid: number
    ctx: Context
    renderbuffer: WebGLRenderbuffer | null = null
    /** 存储宽度（像素） */
    width = 0
    /** 存储高度（像素） */
    height = 0
    internalFormat: TextureInternalFormat = 'DEPTH_COMPONENT16'
    samples = 1

    constructor(ctx: Context, width = 0, height = 0, options: RenderBufferStorageOptions = {}) {
        this.ctx = ctx
        this.uid = RenderBuffer.uid++
        this.applyOptions(options)
        this.createRenderBuffer()
        this.ctx.on('contextlost', () => { this.deleteRenderBuffer() })
        this.ctx.on('contextrestored', () => {
            this.createRenderBuffer()
            // 上下文恢复后显存内容丢失，需要重新分配存储
            this.applyStorage()
        })
        this.ctx.addDisposable(this)
        this.setSize(width, height)
    }

    protected get gl() {
        return this.ctx.gl
    }

    protected applyOptions(options: RenderBufferStorageOptions) {
        if (options.internalFormat !== undefined) { this.internalFormat = options.internalFormat }
        if (options.samples !== undefined) { this.samples = options.samples }
    }

    createRenderBuffer() {
        if (this.renderbuffer !== null) { return }
        this.renderbuffer = this.gl.createRenderbuffer()
    }
    deleteRenderBuffer() {
        if (this.renderbuffer === null) { return }
        this.gl.deleteRenderbuffer(this.renderbuffer)
        this.renderbuffer = null
    }
    bind() {
        this.ctx.bindRenderBuffer(this.renderbuffer)
    }
    unbind() {
        this.ctx.bindRenderBuffer(null)
    }
    /** 设置尺寸并分配存储；格式/采样数未指定时沿用当前值 */
    setSize(width: number, height: number, options: RenderBufferStorageOptions = {}) {
        this.width = width
        this.height = height
        this.applyOptions(options)
        this.applyStorage()
    }
    /** 按当前尺寸/格式/采样数申请显存，上下文恢复时会被重新调用 */
    applyStorage() {
        if (this.width <= 0 || this.height <= 0) { return }
        this.bind()
        const gl = this.gl
        if (this.samples > 1) {
            const samples = Math.min(this.samples, this.ctx.capabilities.maxSamples)
            gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl[this.internalFormat], this.width, this.height)
        } else {
            gl.renderbufferStorage(gl.RENDERBUFFER, gl[this.internalFormat], this.width, this.height)
        }
    }
    dispose(): void {
        if (this.isDisposed) { return }
        this.isDisposed = true
        this.deleteRenderBuffer()
        this.ctx.resources.delete(this)
    }
}
