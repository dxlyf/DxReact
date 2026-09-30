import type { Context } from "./context"
import type { IResource } from "./resource"
import type { FramebufferAttachment, TexImage2DTarget } from "./types"
import type { RenderBuffer } from "./render_buffer"
import type { Texture } from "./textures"

/** 单条附件记录，上下文恢复后按此重新挂载 */
type AttachmentRecord = {
    attachment: FramebufferAttachment
    /** 纹理附件 */
    texture?: Texture
    /** 纹理附件的 target（立方体贴图需指定具体面） */
    textarget?: TexImage2DTarget
    level?: number
    /** 渲染缓冲附件 */
    renderbuffer?: RenderBuffer
}

/**
 * 帧缓冲（FrameBuffer）
 * 离屏渲染目标：把纹理或渲染缓冲挂到颜色/深度/模板附件上。
 * 附件以引擎对象（Texture / RenderBuffer）形式记录，上下文恢复后可自动重新挂载。
 */
export class FrameBuffer implements IResource {
    static uid = 0

    isDisposed = false
    readonly uid: number
    ctx: Context
    framebuffer: WebGLFramebuffer | null = null
    /** 已挂载的附件记录 */
    attachments: AttachmentRecord[] = []
    /** 已设置的绘制缓冲列表 */
    drawBuffersList: FramebufferAttachment[] = []
    /** 上下文恢复后待重新挂载（延迟到下一次 bind，确保附件底层对象已重建） */
    protected pendingRestore = false

    constructor(ctx: Context) {
        this.ctx = ctx
        this.uid = FrameBuffer.uid++
        this.createFrameBuffer()
        this.ctx.on('contextlost', () => { this.deleteFrameBuffer() })
        this.ctx.on('contextrestored', () => {
            this.createFrameBuffer()
            this.pendingRestore = true
        })
        this.ctx.addDisposable(this)
    }

    protected get gl() {
        return this.ctx.gl
    }

    createFrameBuffer() {
        if (this.framebuffer !== null) { return }
        this.framebuffer = this.gl.createFramebuffer()
    }
    deleteFrameBuffer() {
        if (this.framebuffer === null) { return }
        this.gl.deleteFramebuffer(this.framebuffer)
        this.framebuffer = null
    }
    bind() {
        this.ctx.bindFrameBuffer(this.framebuffer)
        if (this.pendingRestore) {
            this.pendingRestore = false
            this.applyAttachments()
        }
    }
    unbind() {
        this.ctx.bindFrameBuffer(null)
    }
    /** 挂载纹理；textarget 用于立方体贴图指定具体某个面 */
    attachTexture(attachment: FramebufferAttachment, texture: Texture, textarget: TexImage2DTarget = 'TEXTURE_2D', level = 0) {
        this.record({ attachment, texture, textarget, level })
        this.bind()
        this.ctx.framebufferTexture2D(attachment, textarget, texture.texture, level)
    }
    /** 挂载渲染缓冲，通常用于深度/模板附件 */
    attachRenderBuffer(attachment: FramebufferAttachment, renderbuffer: RenderBuffer) {
        this.record({ attachment, renderbuffer })
        this.bind()
        this.ctx.framebufferRenderbuffer(attachment, renderbuffer.renderbuffer)
    }
    /** 卸载指定附件 */
    detach(attachment: FramebufferAttachment) {
        const index = this.attachments.findIndex(record => record.attachment === attachment)
        if (index === -1) { return }
        const record = this.attachments[index]
        this.attachments.splice(index, 1)
        this.bind()
        if (record.renderbuffer) {
            this.ctx.framebufferRenderbuffer(attachment, null)
        } else {
            this.ctx.framebufferTexture2D(attachment, record.textarget, null, record.level)
        }
    }
    /** 设置绘制缓冲，MRT 时指定输出到哪几个颜色附件 */
    setDrawBuffers(attachments: FramebufferAttachment[]) {
        this.drawBuffersList = attachments.slice()
        this.bind()
        this.gl.drawBuffers(attachments.map(attachment => this.gl[attachment]))
    }
    /** 已绑定，检查完整性，不完整时抛错 */
    checkStatus() {
        this.bind()
        const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER)
        if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
            throw new Error('FrameBuffer 不完整，状态码: 0x' + status.toString(16))
        }
    }
    isComplete() {
        this.bind()
        return this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) === this.gl.FRAMEBUFFER_COMPLETE
    }

    /** 维护附件记录，同一附件点只保留一条 */
    protected record(next: AttachmentRecord) {
        const record = this.attachments.find(item => item.attachment === next.attachment)
        if (record) {
            Object.assign(record, next)
        } else {
            this.attachments.push(next)
        }
    }
    /** 重新挂载全部附件与绘制缓冲，调用前需已绑定帧缓冲 */
    protected applyAttachments() {
        if (this.attachments.length === 0) { return }
        for (let i = 0; i < this.attachments.length; i++) {
            const record = this.attachments[i]
            if (record.renderbuffer) {
                this.ctx.framebufferRenderbuffer(record.attachment, record.renderbuffer.renderbuffer)
            } else if (record.texture) {
                this.ctx.framebufferTexture2D(record.attachment, record.textarget, record.texture.texture, record.level)
            }
        }
        if (this.drawBuffersList.length > 0) {
            this.setDrawBuffers(this.drawBuffersList)
        }
    }
    dispose(): void {
        if (this.isDisposed) { return }
        this.isDisposed = true
        this.attachments.length = 0
        this.deleteFrameBuffer()
        this.ctx.resources.delete(this)
    }
}
