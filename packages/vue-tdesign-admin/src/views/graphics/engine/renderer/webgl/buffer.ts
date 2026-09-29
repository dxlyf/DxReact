import { Context } from "./context";
import { IResource } from "./resource";
import { BufferDataUsage, BufferTarget } from "./types";

export class Buffer implements IResource {
    static uid = 0
    isDisposed = false;

    buffer: WebGLBuffer
    ctx: Context;
    constructor(ctx: Context) {
        this.ctx = ctx;
        this.createBuffer()
        this.ctx.on('contextlost',()=>{
            this.deleteBuffer()
        })
        this.ctx.on('contextrestored',()=>{
            this.createBuffer()
        })
    }
    createBuffer() {
        this.deleteBuffer()
        this.buffer = this.ctx.gl.createBuffer();
    }
    deleteBuffer(){
        if (this.buffer) {
            this.ctx.gl.deleteBuffer(this.buffer);
            this.buffer = null;
        }
    }
    bind(){}
    unbind(){}
    dispose(): void {
        if (this.isDisposed) {
            return;
        }
        this.isDisposed = true
        this.deleteBuffer()
    }
}
