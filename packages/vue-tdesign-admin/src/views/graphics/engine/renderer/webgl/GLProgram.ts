

export class GLContext {
    gl: WebGL2RenderingContext

    constructor(canvas: HTMLCanvasElement) {
        this.gl = canvas.getContext('webgl2')!
    }
}

export type GLProgramOptions = {
    precision?: 'lowp' | 'mediump' | 'highp'
    uniforms?: Record<string, number>
    attributes?: Record<string, number>
}
export type AttributeMate = {
    name: string
    location: number
    type: number
    size: number
}
export type UnifromBlcokMemberMate = {
    name: string
    type: number
    size: number
    offset: number
}
export type UnifromMate = {
    king: string //'uniform' | 'block' | 'array' | 'struct'
    name: string
    location: WebGLUniformLocation | null // unifrom block null
    type?: number
    size?: number
    index?: number // array index
    blockIndex?: number | null // unifrom block null
    binding?: number | null // unifrom block null
    members?: UnifromBlcokMemberMate[]
}
export class GLProgram {
    program: WebGLProgram
    gl: WebGL2RenderingContext
    attributes: Map<string, AttributeMate>
    uniforms: Map<string, UnifromMate>
    options: GLProgramOptions
    constructor(gl: WebGL2RenderingContext, options?: GLProgramOptions) {
        this.gl = gl
        this.options = { precision: 'highp', ...(options || {}) }
        this.program = this.gl.createProgram()
        this.attributes = new Map()
        this.uniforms = new Map()
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
    compile(vertexShader: string, fragmentShader: string) {
        vertexShader = ['#version 300 es', vertexShader].join('\n')
        fragmentShader = ['#version 300 es', `precision ${this.options.precision} float;`, fragmentShader].join('\n')
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
    initializeAttributes() {
        const count = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_ATTRIBUTES)
        for (let i = 0; i < count; i++) {
            const info = this.gl.getActiveAttrib(this.program, i)
            const location = this.gl.getAttribLocation(this.program, info.name)
            this.attributes.set(info.name, { location, type: info.type, name: info.name, size: info.size })
        }
    }
    initializeUniforms() {
        const gl = this.gl, program = this.program
        const count = gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS)
        const activeUniformsParameters=[
            ['UNIFORM_TYPE','type'],
            ['UNIFORM_SIZE','size'],
            ['UNIFORM_BLOCK_INDEX','blockIndex'],
            ['UNIFORM_OFFSET','offset'],
            ['UNIFORM_ARRAY_STRIDE','arrayStride'],
            ['UNIFORM_MATRIX_STRIDE','matrixStride'],
            ['UNIFORM_IS_ROW_MAJOR','isRowMajor'],
        ]
        const activeUniformBlockParameters =[
            ['UNIFORM_BLOCK_BINDING'],
            ['UNIFORM_BLOCK_DATA_SIZE'],
            ['UNIFORM_BLOCK_ACTIVE_UNIFORMS'],
            ['UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES'], //
            ['UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER'],
            ['UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER']
        ]
        const indecis:number[] = []
        const uniformBlocks:UnifromBlcokMemberMate[] = []
        for (let i = 0; i < count; i++) {
            indecis.push(i)
            const info = gl.getActiveUniform(program, i)
            let uniformName = info.name
            const location = gl.getUniformLocation(program, info.name)
            if (location) {
                let king = 'uniform'
                const isArray = uniformName.indexOf('[') !== -1
                const isStruct = uniformName.indexOf('.') !== -1
                if (isStruct) {
                    king = 'struct'
                }
                if (isArray) {
                    king = 'array'
                }
                if (isArray) {
                    uniformName = uniformName.substring(0, uniformName.indexOf('['))
                    for (let j = 0; j < info.size; j++) {
                        const uniformArrayName = uniformName + '[' + j + ']'
                        const location = gl.getUniformLocation(program, uniformArrayName)
                        this.uniforms.set(uniformArrayName, {
                            king: 'array',
                            name: uniformArrayName,
                            location,
                            type: info.type,
                            size: info.size,
                            index: j
                        })
                    }

                } else {
                    this.uniforms.set(uniformName, {
                        king,
                        name: uniformName,
                        location,
                        type: info.type,
                        size: info.size,
                        index: i
                    })
                }
            }
        }
        const blockCount = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_UNIFORM_BLOCKS)
        for (let i = 0; i < blockCount; i++) {
            const blockName = gl.getActiveUniformBlockName(program, i)
            const blockIndex = gl.getUniformBlockIndex(program, blockName)
            const binding = gl.getActiveUniformBlockParameter(program,blockIndex,gl.UNIFORM_BLOCK_BINDING)
            const blockIndices=gl.getActiveUniformBlockParameter(program,blockIndex,gl.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES)
            const uniformMate:UnifromMate={
                name:blockName,
                king:'block',
                binding,
                blockIndex,
                location:null
            }
            this.uniforms.set(blockName,uniformMate)
            if(blockIndices){
                const types=gl.getActiveUniforms(program,blockIndices,gl.UNIFORM_TYPE)
                const sizes=gl.getActiveUniforms(program,blockIndices,gl.UNIFORM_SIZE)
                const offsets=gl.getActiveUniforms(program,blockIndices,gl.UNIFORM_OFFSET)
                uniformMate.members=blockIndices.map((i,index:number)=>{
                    return {
                        name:blockName+'_'+index,
                        king:'uniform',
                        blockIndex,
                        index,
                        type:types[index],
                        size:sizes[index],
                        offset:offsets[index],
                    }
                })
            }

        }
    }


}