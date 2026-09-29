import { Context } from "./context";
import { BufferDataUsage, BufferTarget } from "./types";
import { Buffer } from "./buffer";



export class VertexBuffer extends Buffer {
    constructor(ctx: Context) {
        super(ctx)
    }
    override bind(){
        this.ctx.bindArrayBuffer(this.buffer)
    }
    override unbind(){
        this.ctx.bindArrayBuffer(null)
    }
    override bufferData(srcData: ArrayBufferView, usage: BufferDataUsage, srcOffset: GLuint, length?: GLuint /* = 0 */){
        const gl=this.ctx.gl
       gl.bufferData(gl.ARRAY_BUFFER, srcData, gl[usage], srcOffset, length)
    }
    override bufferSubData(dstByteOffset: GLintptr, /* [AllowShared] */ srcData: ArrayBufferView, srcOffset: GLuint, length?: GLuint /* = 0 */){
        const gl=this.ctx.gl
       gl.bufferSubData(gl.ARRAY_BUFFER, dstByteOffset, srcData, srcOffset, length)
    }
}