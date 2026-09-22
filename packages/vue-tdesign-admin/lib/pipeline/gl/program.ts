
export type ActiveAttributeMate = {
    name?: string;
    location?: number;
    size?: number;
    type?: number;
}
export type ActiveUniformMate = {
    name: string;
    type: number;
    size: number;
    location: WebGLUniformLocation;
}
export type ActiveUniformBlockMemberMate = {
    name: string;
    type: number;
    size: number;
    offset: number;
}
export type ActiveUniformBlockMate = {
    name: string;
    blockSize: number;
    binding: number;
    blockIndex: number; //blockIndex
    offset: number
    members: ActiveUniformBlockMemberMate[];
}
export class GLProgram {
    static caches: Map<string, WebGLProgram> = new Map();
    static removeCache(key: string) {
        this.caches.delete(key);
    }
    static create(gl: WebGL2RenderingContext, vs: string, fs: string) {
        const key = `${vs}${fs}`;
        if (this.caches.has(key)) {
            return this.caches.get(key)!;
        }
        const program = new GLProgram(gl);
        program.cacheKey = key;
        program.compile(vs, fs);
        program.fetchAttributes();
        program.fetchUniforms();
        program.fetchUniformBlocks();
        this.caches.set(key, program);
        return program;
    }
    cacheKey: string;
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    attributeLocations: Map<string, number> = new Map();
    uniformLocations: Map<string, number | WebGLUniformLocation> = new Map();
    attributes: Map<string, ActiveAttributeMate> = new Map();
    uniforms: Map<string, ActiveUniformMate> = new Map();
    uniformBlocks: Map<string, ActiveUniformBlockMate> = new Map();
    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.program = gl.createProgram();
    }
    compileShader(type: number, source: string) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            throw new Error(this.gl.getShaderInfoLog(shader));
        }
        return shader;
    }
    compile(vs: string, fs: string) {
        const gl = this.gl, program = this.program;
        const vsShader = this.compileShader(gl.VERTEX_SHADER, vs);
        const fsShader = this.compileShader(gl.FRAGMENT_SHADER, fs);
        gl.attachShader(program, vsShader);
        gl.attachShader(program, fsShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(program));
        }
        gl.detachShader(program, vsShader);
        gl.detachShader(program, fsShader);
        gl.deleteShader(vsShader);
        gl.deleteShader(fsShader);
    }
    getAttributeLocation(name: string) {
        if (!this.attributeLocations.has(name)) {
            this.attributeLocations.set(name, this.gl.getAttribLocation(this.program, name));
        }
        return this.attributes.get(name);
    }
    getUniformLocation(name: string) {
        if (!this.uniformLocations.has(name)) {
            this.uniformLocations.set(name, this.gl.getUniformLocation(this.program, name));
        }
        return this.uniforms.get(name);
    }
    getUniformBlockIndex(name: string) {
        if (!this.uniformLocations.has(name)) {
            this.uniformLocations.set(name, this.gl.getUniformBlockIndex(this.program, name));
        }
        return this.uniformLocations.get(name);
    }
    fetchAttributes() {
        const gl = this.gl, program = this.program;
        const count = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES)
        for (let i = 0; i < count; i++) {
            const attr = gl.getActiveAttrib(program, i);
            const name = attr.name;
            const location = gl.getAttribLocation(program, name)
            this.attributes.set(name, { name, location, size: attr.size, type: attr.type });
            this.attributeLocations.set(name, location);
        }
    }
    fetchUniforms() {
        const gl = this.gl, program = this.program;
        const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
        for (let i = 0; i < count; i++) {
            const uniform = gl.getActiveUniform(program, i);
            const name = uniform.name;
            const location = gl.getUniformLocation(program, name);
            if (location === null) {
                // block

                continue;
            }
            if (uniform.size > 1) {
                const startIndex = name.lastIndexOf("[");
                const endIndex = name.lastIndexOf("]");
                const prefix = name.substring(0, startIndex);
                const suffix = name.substring(endIndex + 1);
                for (let j = 0; j < uniform.size; j++) {
                    const arrayName = prefix + `[${j}]` + suffix;
                    const arrayLocation = gl.getUniformLocation(program, arrayName);
                    if (arrayLocation === null) {
                        continue;
                    }
                    this.uniforms.set(arrayName, { name: arrayName, location: arrayLocation, size: 1, type: uniform.type });
                    this.uniformLocations.set(arrayName, arrayLocation);
                }
            } else {
                this.uniforms.set(name, { name, location, size: uniform.size, type: uniform.type });
                this.uniformLocations.set(name, location);
            }

        }
    }
    private getActiveUniformsParameters(){
        return [
            ['UNIFORM_TYPE', 'type'],
            ['UNIFORM_SIZE', 'size'],
            ['UNIFORM_BLOCK_INDEX', 'blockIndex'],
            ['UNIFORM_OFFSET', 'offset'],
            ['UNIFORM_ARRAY_STRIDE', 'arrayStride'],
            ['UNIFORM_MATRIX_STRIDE', 'matrixStride'],
            ['UNIFORM_IS_ROW_MAJOR', 'isRowMajor'],
        ]
    }
    private getActiveUniformBlockParameters(){
        return [
            ['UNIFORM_BLOCK_BINDING', 'binding'],
            ['UNIFORM_BLOCK_DATA_SIZE', 'blockSize'],
            ['UNIFORM_BLOCK_ACTIVE_UNIFORMS', 'activeUniforms'],
            ['UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES', 'activeUniformIndices'], //
            ['UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER', 'referencedByVertexShader'],
            ['UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER', 'referencedByFragmentShader']
        ]
    }
    fetchUniformBlocks() {
        const gl = this.gl, program = this.program;
        const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORM_BLOCKS)
      
        for (let i = 0; i < count; i++) {
            const blockName: string = gl.getActiveUniformBlockName(program, i)
            const blockIndex: number = gl.getUniformBlockIndex(program, blockName)
            const binding: number = gl.getActiveUniformBlockParameter(program, blockIndex, gl.UNIFORM_BLOCK_BINDING)
            const blockSize: number = gl.getActiveUniformBlockParameter(program, blockIndex, gl.UNIFORM_BLOCK_DATA_SIZE)
            const blockIndices: number[] = gl.getActiveUniformBlockParameter(program, blockIndex, gl.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES)
            const uniformMate: ActiveUniformBlockMate = {
                name: blockName,
                binding,
                blockIndex,
                blockSize,
                offset: 0,
                members: []
            }
            this.uniformLocations.set(blockName, blockIndex);
            if (blockIndices) {
                //  const types = gl.getActiveUniforms(program, blockIndices, gl.UNIFORM_TYPE)
                //  const sizes = gl.getActiveUniforms(program, blockIndices, gl.UNIFORM_SIZE)
                const offsets = gl.getActiveUniforms(program, blockIndices, gl.UNIFORM_OFFSET)
                uniformMate.members = Array.from(blockIndices).map((i: number, index: number) => {
                    const info = gl.getActiveUniform(program, i)
                    //   const location = gl.getUniformLocation(program, info.name)
                    uniformMate.offset += offsets[index]
                    return {
                        name: info.name,
                        type: info.type,
                        size: info.size,
                        offset: offsets[index],
                    } as ActiveUniformBlockMemberMate
                })
            }
            this.uniformBlocks.set(blockName, uniformMate);
        }
    }
    dispose() {
        this.gl.deleteProgram(this.program);
        GLProgram.removeCache(this.cacheKey);
    }
}