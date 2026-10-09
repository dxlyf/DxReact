import type { Context } from "./context"
import type { IResource } from "./resource"
import type { AttributeBuffer } from "./attributes"
import type { IndexBuffer } from "./buffer"

/**
 * 顶点数组对象（VertexArray / VAO，WebGL2）
 * 把「顶点属性指针 + ELEMENT_ARRAY_BUFFER 绑定」打包进一个对象，
 * 之后只需 bind() 一次即可恢复整套顶点输入状态，省去重复的 vertexAttribPointer。
 * - 属性缓冲以引擎对象（AttributeBuffer）形式记录，上下文恢复后可自动重放
 * - 注意：属性槽位的启用状态保存在 VAO 内，Context 绑定 VAO 时会清空全局属性缓存
 */
export class VertexArray implements IResource {
    static uid = 0

    isDisposed = false
    readonly uid: number
    ctx: Context
    vertexArray: WebGLVertexArrayObject | null = null
    /** 已挂接的属性缓冲，上下文恢复后按此重放指针 */
    attributeBuffers: AttributeBuffer[] = []
    /** 已挂接的索引缓冲（其绑定属于 VAO 状态） */
    indexBuffer: IndexBuffer | null = null
    /** 上下文恢复后待重新记录（延迟到下一次 bind，确保底层缓冲已重建） */
    protected pendingRestore = false

    constructor(ctx: Context) {
        this.ctx = ctx
        this.uid = VertexArray.uid++
        this.createVertexArray()
        this.ctx.on('contextlost', () => { this.deleteVertexArray() })
        this.ctx.on('contextrestored', () => {
            this.createVertexArray()
            this.pendingRestore = true
        })
        this.ctx.addDisposable(this)
    }

    protected get gl() {
        return this.ctx.gl
    }

    createVertexArray() {
        if (this.vertexArray !== null) { return }
        this.vertexArray = this.gl.createVertexArray()
    }
    deleteVertexArray() {
        if (this.vertexArray === null) { return }
        this.gl.deleteVertexArray(this.vertexArray)
        this.vertexArray = null
    }
    bind() {
        this.ctx.bindVertexArray(this.vertexArray)
        if (this.pendingRestore) {
            this.pendingRestore = false
            this.applyBindings()
        }
    }
    unbind() {
        this.ctx.bindVertexArray(null)
    }
    /** 把属性缓冲记录进本 VAO，并立即写入属性指针 */
    attachAttribute(attributeBuffer: AttributeBuffer) {
        // 先绑定本 VAO：若刚从上下文恢复，bind() 会整体重放已有附件；
        // 重放发生在记录之前，因此新附件不会被重放覆盖，下面只需写一次
        this.bind()
        if (!this.attributeBuffers.includes(attributeBuffer)) {
            this.attributeBuffers.push(attributeBuffer)
        }
        attributeBuffer.bind()
    }
    /** 把索引缓冲记录进本 VAO（ELEMENT_ARRAY_BUFFER 的绑定属于 VAO 状态） */
    attachIndex(indexBuffer: IndexBuffer) {
        this.bind()
        this.indexBuffer = indexBuffer
        indexBuffer.bind()
    }
    /** 一次性挂接属性缓冲与可选索引缓冲 */
    attach(attributeBuffer: AttributeBuffer, indexBuffer?: IndexBuffer) {
        this.attachAttribute(attributeBuffer)
        if (indexBuffer) {
            this.attachIndex(indexBuffer)
        }
    }
    /**
     * 重放全部绑定：把属性指针与索引重新写入当前 VAO
     * 仅在 bind() 中 pendingRestore 时触发；这里的 bind() 是 AttributeBuffer /
     * IndexBuffer 的 bind，不会回调 VertexArray.bind，因此不存在递归
     */
    protected applyBindings() {
        for (let i = 0; i < this.attributeBuffers.length; i++) {
            this.attributeBuffers[i].bind()
        }
        if (this.indexBuffer) {
            this.indexBuffer.bind()
        }
    }
    dispose(): void {
        if (this.isDisposed) { return }
        this.isDisposed = true
        this.attributeBuffers.length = 0
        this.indexBuffer = null
        this.deleteVertexArray()
        this.ctx.resources.delete(this)
    }
}
