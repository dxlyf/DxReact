import {GLState} from './state';
import {Buffer} from './buffer';
import {GLPipeline} from './pipeline';
import type { IDisposable } from '@/rendering/core/Disposable';

export class GLContext extends GLState implements IDisposable{
    disposed:boolean=false;
    gl:WebGL2RenderingContext;
    resources:Set<{dispose():void}>=new Set();
    constructor(gl:WebGL2RenderingContext){
        super(gl);
    }
    addResource(resource:{dispose():void}){
        this.resources.add(resource);
    }
    createBuffer(){
        const buffer = new Buffer(this);
        this.addResource(buffer);
        return buffer;
    }
    createWebGLBuffer(){
        return this.gl.createBuffer();
    }
    createWebGLTexture(){
        return this.gl.createTexture();
    }
    setBufferData(buffer:WebGLBuffer,data:ArrayBuffer){
        this.bindVertexBuffer.set(buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER,data,this.gl.STATIC_DRAW);
    }
    createPipeline(){
        return new GLPipeline(this);
    }
    dispose(){
        if(this.disposed){
            return;
        }
        this.disposed=true;
        this.resources.forEach(resource=>resource.dispose());
        this.resources.clear();
    }
}