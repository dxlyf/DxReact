import { IDisposable } from "./disposable"


export type ActiveAttributeMate = {
    type: number
    name: string
    size: number
    location: number
}
export type ActiveUniformMate = {
    type: number
    name: string
    size: number
    location: WebGLUniformLocation
    isArray?: boolean
    isStruct?: boolean
    structMembers?: ActiveUniformMate[]
    arrayMembers?: Omit<ActiveUniformMate,'name'>[]
}
export type ActiveUniformBlockMemberMate = {
    type: number
    name: string
    size: number
    offset:number
}
export type ActiveUniformBlockMate = {
    name: string
    blockSize: number
    binding: number
    blockIndex: number
    offset:number
    members: ActiveUniformBlockMemberMate[]
}
export type GLProgramOptions = {
    vertexShader: string
    fragmentShader: string
}


export class GLProgram implements IDisposable {
    static programs: Map<string, GLProgram> = new Map()
    static getProgram(gl: WebGL2RenderingContext, options: GLProgramOptions) {
        const key = JSON.stringify(options.vertexShader + ':' + options.fragmentShader)
        if (!this.programs.has(key)) {
            this.programs.set(key, new GLProgram(gl, options))
        }
        return this.programs.get(key)
    }
    program: WebGLProgram
    gl: WebGL2RenderingContext
    attributes: Map<string, ActiveAttributeMate>
    uniforms: Map<string, ActiveUniformMate>
    unifromBlocks: Map<string, ActiveUniformBlockMate>
    options: GLProgramOptions
    constructor(gl: WebGL2RenderingContext, options?: GLProgramOptions) {
        this.gl = gl
        this.options = { vertexShader: '', fragmentShader: '', ...(options || {}) }
        this.program = this.gl.createProgram()
        this.attributes = new Map()
        this.uniforms = new Map()
        this.unifromBlocks = new Map()
        this.compile()
        this.fetchActiveProgram()
    }
    use() {
        this.gl.useProgram(this.program)
    }
    createShader(type: number, source: string) {
        const shader = this.gl.createShader(type)
        this.gl.shaderSource(shader, source)
        this.gl.compileShader(shader)
        return shader
    }
    compile() {
        const vertexShader = this.options.vertexShader
        const fragmentShader = this.options.fragmentShader
        const vertexShaderObj = this.createShader(this.gl.VERTEX_SHADER, vertexShader)
        const fragmentShaderObj = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShader)
        this.gl.attachShader(this.program, vertexShaderObj)
        this.gl.attachShader(this.program, fragmentShaderObj)
        this.gl.linkProgram(this.program)
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('Program link failed:', this.gl.getProgramInfoLog(this.program))
            console.error('Vertex shader:', this.gl.getShaderInfoLog(vertexShaderObj))
            console.error('Fragment shader:', this.gl.getShaderInfoLog(fragmentShaderObj))
            return
        }
        this.gl.deleteShader(vertexShaderObj)
        this.gl.deleteShader(fragmentShaderObj)
    }
    fetchActiveProgram() {
        this.fetchActiveAttributes()
        this.fetchActiveUniforms()
        this.fetchActiveUniformBlocks()
    }
    fetchActiveAttributes() {
        const count = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_ATTRIBUTES)
        for (let i = 0; i < count; i++) {
            const info = this.gl.getActiveAttrib(this.program, i)
            const location = this.gl.getAttribLocation(this.program, info.name)
            this.attributes.set(info.name, { location, type: info.type, name: info.name, size: info.size })
        }
    }
    fetchActiveUniforms() {
        const gl = this.gl, program = this.program
        const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
        for (let i = 0; i < count; i++) {
            const info = gl.getActiveUniform(program, i)
            const uniformName = info.name
            const location = gl.getUniformLocation(program, uniformName)
            if (!location) {
                continue
            }
        
            const isArray = uniformName.indexOf('[') !== -1
            const isStruct = uniformName.indexOf('.') !== -1
            if (isArray&&info.size>1) {
                const arrayStart=uniformName.lastIndexOf('[')
                const prefixUniformName = uniformName.substring(0,arrayStart)
                const subfixUniformName = uniformName.substring(uniformName.indexOf(']',arrayStart)+1)
                for (let j = 0; j < info.size; j++) {
                    const uniformArrayName = prefixUniformName + '[' + j + ']' + subfixUniformName
                    const location = gl.getUniformLocation(program, uniformArrayName)
                    this.uniforms.set(uniformArrayName, {
                        name: uniformArrayName,
                        location,
                        type: info.type,
                        size: info.size,
                        isArray,
                        isStruct,
                    })
                }

            } else {
                this.uniforms.set(uniformName, {
                    name: uniformName,
                    location,
                    type: info.type,
                    size: info.size,
                    isStruct,
                    isArray,
                })
            }

        }

    }
    fetchActiveUniformBlocks() {
        const gl = this.gl, program = this.program
          const activeUniformsParameters = [
            ['UNIFORM_TYPE', 'type'],
            ['UNIFORM_SIZE', 'size'],
            ['UNIFORM_BLOCK_INDEX', 'blockIndex'],
            ['UNIFORM_OFFSET', 'offset'],
            ['UNIFORM_ARRAY_STRIDE', 'arrayStride'],
            ['UNIFORM_MATRIX_STRIDE', 'matrixStride'],
            ['UNIFORM_IS_ROW_MAJOR', 'isRowMajor'],
        ]
        const activeUniformBlockParameters = [
            ['UNIFORM_BLOCK_BINDING'],
            ['UNIFORM_BLOCK_DATA_SIZE'],
            ['UNIFORM_BLOCK_ACTIVE_UNIFORMS'],
            ['UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES'], //
            ['UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER'],
            ['UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER']
        ]
        const indecis: number[] = []
        const blockCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORM_BLOCKS)
        for (let i = 0; i < blockCount; i++) {
            const blockName:string = gl.getActiveUniformBlockName(program, i)
            const blockIndex:number = gl.getUniformBlockIndex(program, blockName)
            const binding:number = gl.getActiveUniformBlockParameter(program, blockIndex, gl.UNIFORM_BLOCK_BINDING)
            const blockSize:number=gl.getActiveUniformBlockParameter(program,blockIndex,gl.UNIFORM_BLOCK_DATA_SIZE)
            const blockIndices:number[] = gl.getActiveUniformBlockParameter(program, blockIndex, gl.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES)
            const uniformMate: ActiveUniformBlockMate = {
                name: blockName,
                binding,
                blockIndex,
                blockSize,
                offset:0,
                members:[]
            }
            this.unifromBlocks.set(blockName, uniformMate)
            if (blockIndices) {
              //  const types = gl.getActiveUniforms(program, blockIndices, gl.UNIFORM_TYPE)
              //  const sizes = gl.getActiveUniforms(program, blockIndices, gl.UNIFORM_SIZE)
                const offsets = gl.getActiveUniforms(program, blockIndices, gl.UNIFORM_OFFSET)
                uniformMate.members = Array.from(blockIndices).map((i: number, index: number) => {
                    const info = gl.getActiveUniform(program, i)
                    //   const location = gl.getUniformLocation(program, info.name)
                    uniformMate.offset+=offsets[index]
                    return {
                        name: info.name,
                        type: info.type,
                        size: info.size,
                        offset: offsets[index],
                    } as ActiveUniformBlockMemberMate
                })
            }

        }
    }

    getAttributeLocation(name: string) {
        const info = this.attributes.get(name)
        if (info) {
            return info.location
        }
        return -1
    }
    getUniformLocation(name: string) {
        const info = this.uniforms.get(name)
        if (info) {
            return info.location
        }
        return null
    }
    dispose(): void {
        this.gl.deleteProgram(this.program)
    }

}