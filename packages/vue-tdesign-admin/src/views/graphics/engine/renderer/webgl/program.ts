import { IDisposable } from "@dxyl/math2";
import { Context } from "./context";
import { ShaderType } from "./types";
import { arrayEquals } from "../utils";

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
type ActiveUniformBlockMemberMate = {
    name: string
    type: number
    size: number
    offset: number
    arrayStride: number
    matrixStride: number
}
type ActiveUniformBlockMate = {
    name: string
    type: number
    blockSize: number
    binding: number
    blockIndex: number
    members: ActiveUniformBlockMemberMate[]
}
type ProgramOptions = {
    vs: string
    fs: string
    defines?: Record<string, string | number | boolean>
    transformFeedbackVaryings?: string[]
    transformFeedbackMode?: 'INTERLEAVED_ATTRIBS' | 'SEPARATE_ATTRIBS'
    attributeLocations?: Record<string, number>
}

class Program implements IDisposable {
    static uid = 0
    static getProgram(ctx: Context, vs: string, fs: string, options: ProgramOptions = { vs, fs }) {
        const key = Program.buildKey(vs, fs, options)
        let program = ctx.programCache.get(key)
        if (!program) {
            program = new Program(ctx, vs, fs, options)
            ctx.programCache.set(key, program)
        }
        return program
    }
    private static buildKey(vs: string, fs: string, options: ProgramOptions) {
        const defines = options.defines || {}
        const defineKey = Object.keys(defines).sort().map(key => `${key}=${defines[key]}`).join(',')
        const attributeKey = Object.keys(options.attributeLocations || {}).sort().map(key => `${key}=${options.attributeLocations[key]}`).join(',')
        const varyings = (options.transformFeedbackVaryings || []).join(',')
        return [vs, fs, defineKey, attributeKey, varyings, options.transformFeedbackMode || ''].join('\u0000')
    }
    isDisposed: boolean = false
    ctx: Context;
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    uid: number
    key: string
    options: ProgramOptions
    attributes = new Map<string, ActiveAttributeMate>()
    uniforms = new Map<string, ActiveUniformMate>()
    uniformBlocks = new Map<string, ActiveUniformBlockMate>()
    uniformLocations = new Map<string, WebGLUniformLocation>()
    attributeLocations = new Map<string, number>()
    uniformDirtyValues = new Map<string, any>()
    /** 着色器源码留存，上下文恢复后需要重新编译 */
    readonly vsSource: string
    readonly fsSource: string
    constructor(ctx: Context, vs: string, fs: string, options: ProgramOptions = { vs, fs }) {
        this.ctx = ctx;
        this.gl = ctx.gl;
        this.options = options;
        this.vsSource = vs;
        this.fsSource = fs;
        this.key = Program.buildKey(vs, fs, options);
        this.program = this.compileProgram(vs, fs, options);
        this.uid = Program.uid++
        // program 句柄不随上下文存活，需要自行重建
        this.ctx.on('contextlost', () => {
            if (this.program) {
                this.gl.deleteProgram(this.program)
                this.program = null
            }
            this.resetCaches()
        })
        this.ctx.on('contextrestored', () => {
            this.program = this.compileProgram(this.vsSource, this.fsSource, this.options)
            this.resetCaches()
        })
        ctx.addDisposable(this)
    }
    /** 清空所有从 program 派生的缓存（属性/Uniform/UniformBlock 位置与去重值） */
    protected resetCaches() {
        this.attributes.clear()
        this.uniforms.clear()
        this.uniformBlocks.clear()
        this.uniformLocations.clear()
        this.attributeLocations.clear()
        this.uniformDirtyValues.clear()
    }
    use() {
        this.ctx.useProgram(this);
    }
    createShader(type: ShaderType, source: string) {
        const gl = this.gl
        const shader = gl.createShader(gl[type]);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            gl.deleteShader(shader);
            throw new Error('Failed to compile shader:' + gl.getShaderInfoLog(shader));
        }
        return shader;
    }
    compileProgram(vertexShaderSource: string, fragmentShaderSource: string, options: ProgramOptions = { vs: vertexShaderSource, fs: fragmentShaderSource }) {
        const gl = this.gl
        const program = gl.createProgram()
        const vertexShader = this.createShader('VERTEX_SHADER', this.injectDefines(vertexShaderSource, options.defines));
        const fragmentShader = this.createShader('FRAGMENT_SHADER', this.injectDefines(fragmentShaderSource, options.defines));
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        const attributeLocations = options.attributeLocations
        if (attributeLocations) {
            for (const name of Object.keys(attributeLocations)) {
                gl.bindAttribLocation(program, attributeLocations[name], name);
            }
        }
        const varyings = options.transformFeedbackVaryings
        if (varyings && varyings.length > 0) {
            gl.transformFeedbackVaryings(program, varyings, gl[options.transformFeedbackMode || 'INTERLEAVED_ATTRIBS']);
        }
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.deleteProgram(program);
            throw new Error('Failed to link program:' + gl.getProgramInfoLog(program));
        }
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        return program;
    }
    private injectDefines(source: string, defines?: ProgramOptions['defines']) {
        if (!defines) {
            return source
        }
        const keys = Object.keys(defines)
        if (keys.length === 0) {
            return source
        }
        let header = ''
        for (const key of keys) {
            const value = defines[key]
            header += value === true ? `#define ${key}\n` : `#define ${key} ${value}\n`
        }
        // #version 必须是首条非注释指令，宏需插到它后面
        const versionMatch = source.match(/^\s*#version[^\n]*\n/)
        if (versionMatch) {
            return versionMatch[0] + header + source.slice(versionMatch[0].length)
        }
        return header + source
    }
    fetchAttributes() {
        if (this.attributes.size > 0) {
            return
        }
        const gl = this.gl, program = this.program
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
                this.attributeLocations.set(attr.name, location)
            }
        }
    }
    fetchUniforms() {
        if (this.uniforms.size > 0) {
            return
        }
        const gl = this.gl, program = this.program
        const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < count; i++) {
            const uniform = gl.getActiveUniform(program, i);
            // 数组以 u[0] 形式返回，基础名去掉下标，供 uniform*fv 整段设置
            const isArray = uniform.name.endsWith('[0]')
            const baseName = isArray ? uniform.name.slice(0, -3) : uniform.name
            const location = gl.getUniformLocation(program, baseName)
            if (!location) {
                continue
            }
            const size = uniform.size, type = uniform.type
            this.uniforms.set(baseName, {
                name: baseName,
                type: type,
                location: location,
                size: size,
            })
            this.uniformLocations.set(baseName, location)
            // 数组元素逐个保留（u[0]、u[1]……），供按具体下标单独设置
            if (isArray) {
                for (let j = 0; j < size; j++) {
                    const elementName = `${baseName}[${j}]`
                    const elementLocation = gl.getUniformLocation(program, elementName)
                    if (!elementLocation) {
                        continue
                    }
                    this.uniforms.set(elementName, {
                        name: elementName,
                        type: type,
                        location: elementLocation,
                        size: size,
                    })
                    this.uniformLocations.set(elementName, elementLocation)
                }
            }
        }
    }
    fetchUniformsBlock() {
        if (this.uniformBlocks.size > 0) {
            return
        }
        const gl = this.ctx.gl, program = this.program
        const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORM_BLOCKS);
        for (let i = 0; i < count; i++) {
            const blockName = gl.getActiveUniformBlockName(program, i);
            const blockIndex = gl.getUniformBlockIndex(program, blockName)
            const binding = gl.getActiveUniformBlockParameter(program, blockIndex, gl.UNIFORM_BLOCK_BINDING)
            const blockSize = gl.getActiveUniformBlockParameter(program, blockIndex, gl.UNIFORM_BLOCK_DATA_SIZE)
            const indices = gl.getActiveUniformBlockParameter(program, blockIndex, gl.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES)
            const offsets = gl.getActiveUniforms(program, indices, gl.UNIFORM_OFFSET)
            const arrayStride = gl.getActiveUniforms(program, indices, gl.UNIFORM_ARRAY_STRIDE)
            const matrixStride = gl.getActiveUniforms(program, indices, gl.UNIFORM_MATRIX_STRIDE)
            const blockInfo: ActiveUniformBlockMate = {
                name: blockName,
                type: binding,
                blockSize: blockSize,
                binding: binding,
                blockIndex: blockIndex,
                members: [],
            }
            for (let j = 0; j < indices.length; j++) {
                const index = indices[j]
                const uniform = gl.getActiveUniform(program, index)

                blockInfo.members.push({
                    name: uniform.name,
                    type: uniform.type,
                    size: uniform.size,
                    offset: offsets[j],
                    arrayStride: arrayStride[j],
                    matrixStride: matrixStride[j],
                })
            }
            this.uniformBlocks.set(blockName, blockInfo)
        }
    }
    getUniformBlockIndex(blockName: string) {
        this.fetchUniformsBlock()
        const block = this.uniformBlocks.get(blockName)
        if (!block) {
            throw new Error(`uniform block ${blockName} not found`)
        }
        return block.blockIndex
    }
    uniformBlockBinding(blockName: string, binding: number) {
        this.fetchUniformsBlock()
        const block = this.uniformBlocks.get(blockName)
        if (!block) {
            throw new Error(`uniform block ${blockName} not found`)
        }
        if (block.binding === binding) {
            return
        }
        block.binding = binding
        this.gl.uniformBlockBinding(this.program, block.blockIndex, binding)
    }
    getAttributeLocation(attributeName: string) {
        let location = this.attributeLocations.get(attributeName)
        if (location === undefined) {
            location = this.ctx.gl.getAttribLocation(this.program, attributeName)
            if (location < 0) {
                throw new Error(`attribute ${attributeName} not found`)
            }
            this.attributeLocations.set(attributeName, location)
        }
        return location
    }
    getUniformLocation(uniformName: string) {
        let location = this.uniformLocations.get(uniformName)
        if (!location) {
            location = this.ctx.gl.getUniformLocation(this.program, uniformName)
            if (!location) {
                throw new Error(`uniform ${uniformName} not found`)
            }
            this.uniformLocations.set(uniformName, location)
        }
        return location
    }
    setUniform1i(name: string, value: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue === value) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, value)
        this.gl.uniform1i(location, value)
    }
    setUniform2i(name: string, x: number, y: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && prevValue.x === x && prevValue.y === y) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { x, y })
        this.gl.uniform2i(location, x, y)
    }
    setUniform3i(name: string, x: number, y: number, z: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && prevValue.x === x && prevValue.y === y && prevValue.z === z) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { x, y, z })
        this.gl.uniform3i(location, x, y, z)
    }
    setUniform4i(name: string, x: number, y: number, z: number, w: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && prevValue.x === x && prevValue.y === y && prevValue.z === z && prevValue.w === w) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { x, y, z, w })
        this.gl.uniform4i(location, x, y, z, w)
    }

    setUniform1f(name: string, value: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue === value) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, value)
        this.gl.uniform1f(location, value)
    }
    setUniform2f(name: string, x: number, y: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && prevValue.x === x && prevValue.y === y) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { x, y })
        this.gl.uniform2f(location, x, y)
    }
    setUniform3f(name: string, x: number, y: number, z: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && prevValue.x === x && prevValue.y === y && prevValue.z === z) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { x, y, z })
        this.gl.uniform3f(location, x, y, z)
    }
    setUniform4f(name: string, x: number, y: number, z: number, w: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && prevValue.x === x && prevValue.y === y && prevValue.z === z && prevValue.w === w) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { x, y, z, w })
        this.gl.uniform4f(location, x, y, z, w)
    }
    setUniform2fv(name: string, value: number[] | Float32Array, srcOffset?: number, srcLength?: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && arrayEquals(prevValue.value, value) && prevValue.srcOffset === srcOffset && prevValue.srcLength === srcLength) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { value, srcOffset, srcLength })
        this.gl.uniform2fv(location, value, srcOffset, srcLength)
    }
    setUniform3fv(name: string, value: number[] | Float32Array, srcOffset?: number, srcLength?: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && arrayEquals(prevValue.value, value) && prevValue.srcOffset === srcOffset && prevValue.srcLength === srcLength) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { value, srcOffset, srcLength })
        this.gl.uniform3fv(location, value, srcOffset, srcLength)
    }
    setUniform4fv(name: string, value: number[] | Float32Array, srcOffset?: number, srcLength?: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && arrayEquals(prevValue.value, value) && prevValue.srcOffset === srcOffset && prevValue.srcLength === srcLength) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { value, srcOffset, srcLength })
        this.gl.uniform4fv(location, value, srcOffset, srcLength)
    }
    setUniform1fv(name: string, value: number[] | Float32Array, srcOffset?: number, srcLength?: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && arrayEquals(prevValue.value, value) && prevValue.srcOffset === srcOffset && prevValue.srcLength === srcLength) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { value, srcOffset, srcLength })
        this.gl.uniform1fv(location, value, srcOffset, srcLength)
    }
    setUniform1ui(name: string, value: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue === value) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, value)
        this.gl.uniform1ui(location, value)
    }
    setUniform2ui(name: string, x: number, y: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && prevValue.x === x && prevValue.y === y) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { x, y })
        this.gl.uniform2ui(location, x, y)
    }
    setUniform3ui(name: string, x: number, y: number, z: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && prevValue.x === x && prevValue.y === y && prevValue.z === z) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { x, y, z })
        this.gl.uniform3ui(location, x, y, z)
    }
    setUniform4ui(name: string, x: number, y: number, z: number, w: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && prevValue.x === x && prevValue.y === y && prevValue.z === z && prevValue.w === w) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { x, y, z, w })
        this.gl.uniform4ui(location, x, y, z, w)
    }
    setUniform1iv(name: string, value: number[] | Int32Array, srcOffset?: number, srcLength?: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && arrayEquals(prevValue.value, value) && prevValue.srcOffset === srcOffset && prevValue.srcLength === srcLength) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { value, srcOffset, srcLength })
        this.gl.uniform1iv(location, value, srcOffset, srcLength)
    }
    setUniform2iv(name: string, value: number[] | Int32Array, srcOffset?: number, srcLength?: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && arrayEquals(prevValue.value, value) && prevValue.srcOffset === srcOffset && prevValue.srcLength === srcLength) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { value, srcOffset, srcLength })
        this.gl.uniform2iv(location, value, srcOffset, srcLength)
    }
    setUniform3iv(name: string, value: number[] | Int32Array, srcOffset?: number, srcLength?: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && arrayEquals(prevValue.value, value) && prevValue.srcOffset === srcOffset && prevValue.srcLength === srcLength) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { value, srcOffset, srcLength })
        this.gl.uniform3iv(location, value, srcOffset, srcLength)
    }
    setUniform4iv(name: string, value: number[] | Int32Array, srcOffset?: number, srcLength?: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && arrayEquals(prevValue.value, value) && prevValue.srcOffset === srcOffset && prevValue.srcLength === srcLength) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { value, srcOffset, srcLength })
        this.gl.uniform4iv(location, value, srcOffset, srcLength)
    }
    setUniform1uiv(name: string, value: number[] | Uint32Array, srcOffset?: number, srcLength?: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && arrayEquals(prevValue.value, value) && prevValue.srcOffset === srcOffset && prevValue.srcLength === srcLength) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { value, srcOffset, srcLength })
        this.gl.uniform1uiv(location, value, srcOffset, srcLength)
    }
    setUniform2uiv(name: string, value: number[] | Uint32Array, srcOffset?: number, srcLength?: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && arrayEquals(prevValue.value, value) && prevValue.srcOffset === srcOffset && prevValue.srcLength === srcLength) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { value, srcOffset, srcLength })
        this.gl.uniform2uiv(location, value, srcOffset, srcLength)
    }
    setUniform3uiv(name: string, value: number[] | Uint32Array, srcOffset?: number, srcLength?: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && arrayEquals(prevValue.value, value) && prevValue.srcOffset === srcOffset && prevValue.srcLength === srcLength) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { value, srcOffset, srcLength })
        this.gl.uniform3uiv(location, value, srcOffset, srcLength)
    }
    setUniform4uiv(name: string, value: number[] | Uint32Array, srcOffset?: number, srcLength?: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && arrayEquals(prevValue.value, value) && prevValue.srcOffset === srcOffset && prevValue.srcLength === srcLength) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { value, srcOffset, srcLength })
        this.gl.uniform4uiv(location, value, srcOffset, srcLength)
    }
    setUniformMat2fv(name: string, transpose: boolean=false, value: number[] | Float32Array, srcOffset?: number, srcLength?: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && arrayEquals(prevValue.value, value) && prevValue.transpose === transpose && prevValue.srcOffset === srcOffset && prevValue.srcLength === srcLength) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { transpose, value, srcOffset, srcLength })
        this.gl.uniformMatrix2fv(location, transpose, value, srcOffset, srcLength)
    }
    setUniformMat3fv(name: string, transpose: boolean=false, value: number[] | Float32Array, srcOffset?: number, srcLength?: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && arrayEquals(prevValue.value, value) && prevValue.transpose === transpose && prevValue.srcOffset === srcOffset && prevValue.srcLength === srcLength) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { transpose, value, srcOffset, srcLength })
        this.gl.uniformMatrix3fv(location, transpose, value, srcOffset, srcLength)
    }
    setUniformMat4fv(name: string, transpose: boolean=false, value: number[] | Float32Array, srcOffset?: number, srcLength?: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && arrayEquals(prevValue.value, value) && prevValue.transpose === transpose && prevValue.srcOffset === srcOffset && prevValue.srcLength === srcLength) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { transpose, value, srcOffset, srcLength })
        this.gl.uniformMatrix4fv(location, transpose, value, srcOffset, srcLength)
    }
    setUniformMat2x3fv(name: string, transpose: boolean=false, value: number[] | Float32Array, srcOffset?: number, srcLength?: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && arrayEquals(prevValue.value, value) && prevValue.transpose === transpose && prevValue.srcOffset === srcOffset && prevValue.srcLength === srcLength) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { transpose, value, srcOffset, srcLength })
        this.gl.uniformMatrix2x3fv(location, transpose, value, srcOffset, srcLength)
    }
    setUniformMat2x4fv(name: string, transpose: boolean=false, value: number[] | Float32Array, srcOffset?: number, srcLength?: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && arrayEquals(prevValue.value, value) && prevValue.transpose === transpose && prevValue.srcOffset === srcOffset && prevValue.srcLength === srcLength) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { transpose, value, srcOffset, srcLength })
        this.gl.uniformMatrix2x4fv(location, transpose, value, srcOffset, srcLength)
    }
    setUniformMat3x2fv(name: string, transpose: boolean=false, value: number[] | Float32Array, srcOffset?: number, srcLength?: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && arrayEquals(prevValue.value, value) && prevValue.transpose === transpose && prevValue.srcOffset === srcOffset && prevValue.srcLength === srcLength) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { transpose, value, srcOffset, srcLength })
        this.gl.uniformMatrix3x2fv(location, transpose, value, srcOffset, srcLength)
    }
    setUniformMat3x4fv(name: string, transpose: boolean=false, value: number[] | Float32Array, srcOffset?: number, srcLength?: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && arrayEquals(prevValue.value, value) && prevValue.transpose === transpose && prevValue.srcOffset === srcOffset && prevValue.srcLength === srcLength) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { transpose, value, srcOffset, srcLength })
        this.gl.uniformMatrix3x4fv(location, transpose, value, srcOffset, srcLength)
    }
    setUniformMat4x2fv(name: string, transpose: boolean=false, value: number[] | Float32Array, srcOffset?: number, srcLength?: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && arrayEquals(prevValue.value, value) && prevValue.transpose === transpose && prevValue.srcOffset === srcOffset && prevValue.srcLength === srcLength) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { transpose, value, srcOffset, srcLength })
        this.gl.uniformMatrix4x2fv(location, transpose, value, srcOffset, srcLength)
    }
    setUniformMat4x3fv(name: string, transpose: boolean=false, value: number[] | Float32Array, srcOffset?: number, srcLength?: number) {
        const prevValue = this.uniformDirtyValues.get(name)
        if (prevValue && arrayEquals(prevValue.value, value) && prevValue.transpose === transpose && prevValue.srcOffset === srcOffset && prevValue.srcLength === srcLength) {
            return
        }
        const location = this.getUniformLocation(name)
        this.uniformDirtyValues.set(name, { transpose, value, srcOffset, srcLength })
        this.gl.uniformMatrix4x3fv(location, transpose, value, srcOffset, srcLength)
    }
    dispose() {
        if (this.isDisposed) {
            return
        }
        this.isDisposed = true;
        this.resetCaches()
        // 从缓存中移除，避免后续拿到已销毁的 program
        this.ctx.programCache.delete(this.key)
        if (this.program) {
            this.ctx.gl.deleteProgram(this.program);
        }
    }
}

export type {
    ProgramOptions,
    ActiveUniformBlockMate,
    ActiveUniformBlockMemberMate,
}
export {
    Program,
}