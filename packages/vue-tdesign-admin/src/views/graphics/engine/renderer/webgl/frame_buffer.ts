class FrameBuffer implements IDisposable {
    static uid = 0
    uid: number
    ctx: Context;
    buffer: WebGLFramebuffer;
    isDisposed: boolean = false
    constructor(ctx: Context) {
        this.ctx = ctx;
        this.buffer = ctx.gl.createFramebuffer()
        this.uid = Buffer.uid++
        ctx.addDisposable(this)
    }
    bind() {
        this.ctx.bindFrameBuffer(this.buffer);
    }
    dispose() {
        if (this.isDisposed) {
            return
        }
        this.isDisposed = true;
        this.ctx.gl.deleteFramebuffer(this.buffer);
        this.buffer = null;
    }
}