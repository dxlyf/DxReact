import type { Context } from "./context"
import type { IResource } from "./resource"
import type { Buffer } from "./buffer"
import type { TransformFeedbackMode } from "./types"

/**
 * 变换反馈对象（TransformFeedback，WebGL2）
 * 在顶点着色器（或几何着色阶段）处理完顶点后，把声明的 varyings 写入缓冲，
 * 常用于 GPU 粒子更新、GPU 侧数据回读等。
 * 使用前需：
 * 1. Program 编译时声明 transformFeedbackVaryings
 * 2. 用 bindBuffer(index, buffer) 把反馈缓冲绑到 TRANSFORM_FEEDBACK_BUFFER 的绑定点
 * 3. begin(mode) 后绘制，再 end()
 * - 反馈缓冲以引擎对象（Buffer）形式记录，上下文恢复后可自动重放绑定
 */
export class TransformFeedback implements IResource {
    static uid = 0

    isDisposed = false
    readonly uid: number
    ctx: Context
    transformFeedback: WebGLTransformFeedback | null = null
    /** 是否处于 begin()/end() 之间 */
    active = false
    /** 已绑定的反馈缓冲，key 为绑定点索引，上下文恢复后重放 */
    buffers = new Map<number, Buffer>()
    /** 上下文恢复后待重新绑定（延迟到下一次 bind，确保缓冲已重建） */
    protected pendingRestore = false

    constructor(ctx: Context) {
        this.ctx = ctx
        this.uid = TransformFeedback.uid++
        this.createTransformFeedback()
        this.ctx.on('contextlost', () => { this.deleteTransformFeedback() })
        this.ctx.on('contextrestored', () => {
            this.createTransformFeedback()
            this.pendingRestore = true
        })
        this.ctx.addDisposable(this)
    }

    protected get gl() {
        return this.ctx.gl
    }

    createTransformFeedback() {
        if (this.transformFeedback !== null) { return }
        this.transformFeedback = this.gl.createTransformFeedback()
    }
    deleteTransformFeedback() {
        if (this.transformFeedback === null) { return }
        this.gl.deleteTransformFeedback(this.transformFeedback)
        this.transformFeedback = null
        this.active = false
    }
    bind() {
        this.ctx.bindTransformFeedback(this.transformFeedback)
        if (this.pendingRestore) {
            this.pendingRestore = false
            this.applyBufferBindings()
        }
    }
    unbind() {
        this.ctx.bindTransformFeedback(null)
    }
    /** 把缓冲绑定到反馈绑定点并记录，上下文恢复后重放 */
    bindBuffer(index: number, buffer: Buffer) {
        this.buffers.set(index, buffer)
        this.bind()
        buffer.bindBase(index)
    }
    /** 开始变换反馈捕获 */
    begin(mode: TransformFeedbackMode = 'TRIANGLES') {
        this.ctx.beginTransformFeedback(mode)
        this.active = true
    }
    /** 结束变换反馈捕获 */
    end() {
        this.ctx.endTransformFeedback()
        this.active = false
    }
    /** 暂停捕获（可再 resume，期间反馈缓冲内容保留） */
    pause() {
        this.ctx.pauseTransformFeedback()
    }
    /** 恢复捕获 */
    resume() {
        this.ctx.resumeTransformFeedback()
    }
    /** 重放反馈缓冲绑定，调用前需已绑定本对象 */
    protected applyBufferBindings() {
        this.buffers.forEach((buffer, index) => {
            buffer.bindBase(index)
        })
    }
    dispose(): void {
        if (this.isDisposed) { return }
        this.isDisposed = true
        this.buffers.clear()
        this.deleteTransformFeedback()
        this.ctx.resources.delete(this)
    }
}
