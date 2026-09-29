import { IDisposable } from "@dxyl/math2";
import { Context } from "./context";
import { ShaderType } from "./types";
type ActiveAttributeMate = {
    name: string
    type: number
    size: number
    location: number
}
type ActiveUniformMate = {
    name: string
    type: number
    size: number
    location: WebGLUniformLocation
}
type ActiveUniformBlockMemberMate={
    name: string
    type: number
    size: number
    offset: number
    arrayStride: number
    matrixStride: number
}
type ActiveUniformBlockMate={
    name: string
    type: number
    blockSize:number
    binding:number
    blockIndex:number
    members:ActiveUniformBlockMemberMate[]
}
class Program implements IDisposable {
    static uid = 0
    static getProgram(ctx: Context, vs: string, fs: string) {
        const key = vs + fs;
        if (!ctx.cache.has(key)) {
            ctx.cache.set(key, new Program(ctx, vs, fs));
        }
        return ctx.cache.get(key);
    }
    isDisposed: boolean = false
    ctx: Context;
    program: WebGLProgram;
    uid: number
    attributes = new Map<string, ActiveAttributeMate>()
    uniforms = new Map<string, ActiveUniformMate>()
    uniformBlocks = new Map<string, ActiveUniformBlockMate>()
    constructor(ctx: Context, vs: string, fs: string) {
        this.ctx = ctx;
        this.program = this.compileProgram(vs, fs);
        this.uid = Program.uid++
        ctx.addDisposable(this)
    }
    use() {
        this.ctx.gl.useProgram(this.program);
    }
    createShader(type: ShaderType, source: string) {
        const gl = this.ctx.gl
        const shader = gl.createShader(gl[type]);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            gl.deleteShader(shader);
            throw new Error('Failed to compile shader:' + gl.getShaderInfoLog(shader));
        }
        return shader;
    }
    compileProgram(vertexShaderSource: string, fragmentShaderSource: string) {
        const gl = this.ctx.gl
        const program = gl.createProgram()
        const vertexShader = this.createShader('VERTEX_SHADER', vertexShaderSource);
        const fragmentShader = this.createShader('FRAGMENT_SHADER', fragmentShaderSource);
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.deleteProgram(program);
            throw new Error('Failed to link program:' + gl.getProgramInfoLog(program));
        }
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        return program;
    }
    fetchAttributes() {
        const gl = this.ctx.gl, program = this.program
        const count = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < count; i++) {
            const attr = gl.getActiveAttrib(program, i);
            const location = gl.getAttribLocation(program, attr.name)
            if (location >= 0) {
                this.attributes.set(attr.name, {
                    name: attr.name,
                    type: attr.type,
                    location: location,
                    size: attr.size,
                })
            }
        }
    }
    fetchUniforms() {
        const gl = this.ctx.gl, program = this.program
        const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < count; i++) {
            const uniform = gl.getActiveUniform(program, i);
            const location = gl.getUniformLocation(program, uniform.name)
            if (location) {
                const size = uniform.size, type = uniform.type
                let name = uniform.name
                const isArray = name.endsWith('[0]')
                if (isArray&&size>1) {
                    const prefix=name.slice(0,-3)
                    for(let j=0;j<size;j++){
                        name=prefix+`[${j}]`
                        this.uniforms.set(name,{
                            name: name,
                            type: type,
                            location: location,
                            size: size,
                        })
                    }
                } else {
                    this.uniforms.set(name, {
                        name: name,
                        type: type,
                        location: location,
                        size: size,
                    })
                }

            }
        }
    }
    fetchUniformsBlock() {
        const gl = this.ctx.gl, program = this.program
        const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORM_BLOCKS);
        for (let i = 0; i < count; i++) {
            const blockName = gl.getActiveUniformBlockName(program, i);
            const blockIndex=gl.getUniformBlockIndex(program,blockName)
            const binding = gl.getActiveUniformBlockParameter(program,blockIndex,gl.UNIFORM_BLOCK_BINDING)
            const blockSize = gl.getActiveUniformBlockParameter(program,blockIndex,gl.UNIFORM_BLOCK_DATA_SIZE)
            const indices=gl.getActiveUniformBlockParameter(program,blockIndex,gl.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES)
            const offsets=gl.getActiveUniforms(program,indices,gl.UNIFORM_OFFSET)
            const arrayStride=gl.getActiveUniforms(program,indices,gl.UNIFORM_ARRAY_STRIDE)
            const matrixStride=gl.getActiveUniforms(program,indices,gl.UNIFORM_MATRIX_STRIDE)
            const blockInfo:ActiveUniformBlockMate={
                name: blockName,
                type: binding,
                blockSize: blockSize,
                binding: binding,
                blockIndex: blockIndex,
                members: [],
            }
            for(let j=0;j<indices.length;j++){
                const index=indices[j]
                const uniform=gl.getActiveUniform(program,index)

                blockInfo.members.push({
                    name: uniform.name,
                    type: uniform.type,
                    size: uniform.size,
                    offset: offsets[j],
                    arrayStride: arrayStride[j],
                    matrixStride: matrixStride[j],
                })
            }
            this.uniformBlocks.set(blockName,blockInfo)
        }
    }
    createUniforms(){
        
    }
    dispose() {
        if (this.isDisposed) {
            return
        }
        this.isDisposed = true;
        this.ctx.gl.deleteProgram(this.program);
    }
}

export {
    Program,
}