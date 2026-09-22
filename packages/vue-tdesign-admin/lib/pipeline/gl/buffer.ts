import type { IDisposable } from '@/rendering/core/Disposable';
import { GLContext } from './context';
export class Buffer implements IDisposable{
    ctx:GLContext;
    gl:WebGL2RenderingContext;
    target:number
    buffer:WebGLBuffer;
    data:AllowSharedBufferSource|null|number|ArrayBufferView<ArrayBufferLike>;
    //range:[offset:number,length?:number]|null;
    dstByteOffset?:number
    srcOffset?:number
    srcLength?:number
    usage:number;
    needsUpdate:boolean=false;
    disposed:boolean=false;
    constructor(ctx:GLContext){
        this.ctx=ctx;
        this.gl=ctx.gl;
        this.target=ctx.gl.ARRAY_BUFFER;
        this.usage=ctx.gl.STATIC_DRAW;
        this.data=null;
        this.srcOffset=null;
        this.srcLength=null;
        this.dstByteOffset=null;
        this.buffer=ctx.createWebGLBuffer();
    }
    update(){
        if(!this.needsUpdate){
            return;
        }
        this.needsUpdate=false;
        const target=this.target,gl=this.gl;
        if(target===gl.ARRAY_BUFFER){
            this.ctx.bindVertexBuffer.set(this.buffer);
        }
        else if(target===gl.ELEMENT_ARRAY_BUFFER){
            this.ctx.bindElementBuffer.set(this.buffer);
        }
        if(this.dstByteOffset!==null){
            if(this.srcOffset!==null){
                gl.bufferSubData(target,this.dstByteOffset,this.data as ArrayBufferView<ArrayBufferLike>,this.srcOffset,this.srcLength);
            }else{
                gl.bufferSubData(target,this.dstByteOffset,this.data as ArrayBufferView<ArrayBufferLike>);
            }
        }else{
            if(this.srcOffset!==null){
                gl.bufferData(target,this.data as ArrayBufferView<ArrayBufferLike>,this.usage,this.srcOffset,this.srcLength);
            }else{
                gl.bufferData(target,this.data as AllowSharedBufferSource,this.usage);
            }
        }
    }
    
    dispose(){
        if(this.disposed){
            return;
        }
        this.disposed=true;
        this.ctx.gl.deleteBuffer(this.buffer);
    }
}
