import { f } from "vue-router/dist/router-CWoNjPRp.mjs";

/*** begin---------------------types */

type ComparisonFunc = 'NEVER'
    | 'LESS'
    | 'EQUAL'
    | 'LEQUAL'
    | 'GREATER'
    | 'NOTEQUAL'
    | 'GEQUAL'
    | 'ALWAYS';
type DepthOptions = {
    func?: ComparisonFunc;
    mask?: boolean;
    range?: [number, number];
}
type Capability = 'BLEND'
    | 'CULL_FACE'
    | 'DEPTH_TEST'
    | 'DITHER'
    | 'POLYGON_OFFSET_FILL'
    | 'SAMPLE_ALPHA_TO_COVERAGE'
    | 'SAMPLE_COVERAGE'
    | 'SCISSOR_TEST'
    | 'STENCIL_TEST';

type ClearOptions = {
    color?: [r: number, g: number, b: number, a: number];
    depth?: number;
    stencil?: number;
    colorMask?: [r: boolean, g: boolean, b: boolean, a: boolean];
}
type TextureTarget = 'TEXTURE_2D' | 'TEXTURE_CUBE_MAP';
type BlendEquationMode = 'FUNC_ADD' | 'FUNC_SUBTRACT' | 'FUNC_REVERSE_SUBTRACT';
type BlendFuncDstFactorNoConstant = 'ZERO'
    | 'ONE'
    | 'SRC_COLOR'
    | 'ONE_MINUS_SRC_COLOR'
    | 'DST_COLOR'
    | 'ONE_MINUS_DST_COLOR'
    | 'SRC_ALPHA'
    | 'ONE_MINUS_SRC_ALPHA'
    | 'DST_ALPHA'
    | 'ONE_MINUS_DST_ALPHA';
type BlendFuncDstFactorNoConstantColor = BlendFuncDstFactorNoConstant
    | 'CONSTANT_ALPHA'
    | 'ONE_MINUS_CONSTANT_ALPHA';
type BlendFuncDstFactorNoConstantAlpha = BlendFuncDstFactorNoConstant
    | 'CONSTANT_COLOR'
    | 'ONE_MINUS_CONSTANT_COLOR';
type BlendFuncDstFactor = BlendFuncDstFactorNoConstantAlpha | BlendFuncDstFactorNoConstantColor;
type BlendFuncSrcFactor = BlendFuncDstFactor | 'SRC_ALPHA_SATURATE';
type BufferDataUsage = 'STREAM_DRAW' | 'STATIC_DRAW' | 'DYNAMIC_DRAW';
type CubeMapFaces = 'TEXTURE_CUBE_MAP_POSITIVE_X'
    | 'TEXTURE_CUBE_MAP_NEGATIVE_X'
    | 'TEXTURE_CUBE_MAP_POSITIVE_Y'
    | 'TEXTURE_CUBE_MAP_NEGATIVE_Y'
    | 'TEXTURE_CUBE_MAP_POSITIVE_Z'
    | 'TEXTURE_CUBE_MAP_NEGATIVE_Z';
type TexImage2DTarget = 'TEXTURE_2D' | CubeMapFaces;
type ShaderType = 'FRAGMENT_SHADER' | 'VERTEX_SHADER';
type CullFaceMode = 'FRONT' | 'BACK' | 'FRONT_AND_BACK';
type DrawMode = 'POINTS'
    | 'LINE_STRIP'
    | 'LINE_LOOP'
    | 'LINES'
    | 'TRIANGLE_STRIP'
    | 'TRIANGLE_FAN'
    | 'TRIANGLES';
type ArrayType = 'BYTE'
    | 'UNSIGNED_BYTE'
    | 'SHORT'
    | 'UNSIGNED_SHORT'
    | 'FLOAT'
const ArrayTypeMapByteSize = {
    BYTE: 1,
    UNSIGNED_BYTE: 1,
    SHORT: 2,
    UNSIGNED_SHORT: 2,
    FLOAT: 4,
}
type AttributeDesc = {
    name: string
    type: number
    size: 1 | 2 | 3 | 4
    normalized?: boolean
    stride?: number
    offset?: number
    location?: number
}
type AttributeBufferOptions = {
    stride: number
    type: number
    attributes: AttributeDesc[]
}
type BlendOptions = {
    equation?: BlendEquationMode;
    color?: [r: number, g: number, b: number, a: number];
    src?: BlendFuncSrcFactor;
    dst?: BlendFuncDstFactor;
    srcAlpha?: BlendFuncSrcFactor;
    dstAlpha?: BlendFuncDstFactor;
}
type ActiveAttributeMate = {
    name: string
    type: number
    location: number
}
type ActiveUniformMate = {
    name: string
    type: number
    location: WebGLUniformLocation
}


/****end---------------------types */
function arrayEquals(a: any[], b: any[]) {
    if (a === undefined) {
        return false;
    }
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}
interface IDisposable {
    isDisposed: boolean
    dispose(): void
}

class Buffer implements IDisposable {
    static uid = 0
    uid: number
    ctx: Context;
    buffer: WebGLBuffer;
    isDisposed: boolean = false
    constructor(ctx: Context) {
        this.ctx = ctx;
        this.buffer = ctx.gl.createBuffer();
        this.uid = Buffer.uid++
        ctx.addDisposable(this)
    }
    bind() { }
    dispose() {
        if (this.isDisposed) {
            return
        }
        this.isDisposed = true;
        this.ctx.gl.deleteBuffer(this.buffer);
    }
}
class VertexBuffer extends Buffer {
    override bind() {
        this.ctx.bindArrayBuffer(this.buffer);
    }
}
class IndexBuffer extends Buffer {
    override bind() {
        this.ctx.bindElementBuffer(this.buffer);
    }
}
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
class RenderBuffer implements IDisposable {
    static uid = 0
    uid: number
    ctx: Context;
    buffer: WebGLRenderbuffer;
    isDisposed: boolean = false
    constructor(ctx: Context) {
        this.ctx = ctx;
        this.buffer = ctx.gl.createRenderbuffer()
        this.uid = Buffer.uid++
        ctx.addDisposable(this)
    }
    bind() {
        this.ctx.bindRenderBuffer(this.buffer);
    }
    dispose() {
        if (this.isDisposed) {
            return
        }
        this.isDisposed = true;
        this.ctx.gl.deleteRenderbuffer(this.buffer)
    }
}
class VertexArray implements IDisposable {
    static uid = 0
    uid: number
    ctx: Context;
    vao: WebGLVertexArrayObject;
    isDisposed: boolean = false
    constructor(ctx: Context) {
        this.ctx = ctx;
        this.vao = ctx.gl.createVertexArray()
        this.uid = VertexArray.uid++
        ctx.addDisposable(this)
    }
    dispose() {
        if (this.isDisposed) {
            return
        }
        this.isDisposed = true;
        this.ctx.gl.deleteVertexArray(this.vao);
        this.vao = null;
    }
}

class AttributeBuffer {
    static uid = 0
    ctx: Context;
    type: number
    stride: number
    buffer: Buffer
    attributes: AttributeDesc[] = []
    constructor(ctx: Context, options: AttributeBufferOptions) {
        this.ctx = ctx;
        this.type = options.type;
        this.stride = options.stride;
        this.buffer = new VertexBuffer(ctx);
        this.attributes = options.attributes.map((attr, i) => {
            return {
                offset: 0,
                stride: this.stride,
                type: this.type,
                location: i,
                normalized: false,
                ...attr,
            }
        });
    }
    bind() {
        this.buffer.bind();
        const attribues = this.attributes, gl = this.ctx.gl;
        for (let i = 0; i < attribues.length; i++) {
            const attr = attribues[i];
            this.ctx.enableVertexAttribArray(attr.location);
            gl.vertexAttribPointer(attr.location, attr.size, attr.type, attr.normalized, attr.stride, attr.offset);
        }
    }
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
                const isArray = name.endsWith(']') && size > 1
                if (isArray) {
                    const prefix=name.substring(0,name.lastIndexOf('['))
                    const suffix=name.substring(name.lastIndexOf(']')+1)
                    for(let j=0;j<size;j++){
                        name=prefix+`[${j}]`+suffix
                        this.uniforms.set(name,{
                            name: name,
                            type: type,
                            location: location,
                        })
                    }
                } else {
                    this.uniforms.set(name, {
                        name: name,
                        type: type,
                        location: location,
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
            const uniformBlock = gl.getUniformBlockIndex(program, blockName);
            const name = uniformBlock.name
            const size = uniformBlock.size
            this.uniforms.set(name, {
                name: name,
                type: uniformBlock.type,
                location: uniformBlock.location,
                size: size,
            })
        }
    }
    dispose() {
        if (this.isDisposed) {
            return
        }
        this.isDisposed = true;
        this.ctx.gl.deleteProgram(this.program);
    }
}
class Context {
    gl: WebGL2RenderingContext;
    cache = new Map<string, any>();
    capabilities: {
        maxTexture: number,
        maxVertexTextures: number,
        maxTextureSize: number,
        maxCubemapSize: number,
        maxAttributes: number,
        maxVertexUniforms: number,
        maxVeryings: number,
        maxFragmentUniforms: number,
        maxSamples: number,
        samples: number,
        textureUnits: number,
    };
    resources = new Set<IDisposable>()
    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.capabilities = {
            maxTexture: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
            maxVertexTextures: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
            maxCubemapSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
            maxAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
            maxVertexUniforms: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
            maxVeryings: gl.getParameter(gl.MAX_VARYING_VECTORS),
            maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
            maxSamples: gl.getParameter(gl.MAX_SAMPLES),
            samples: gl.getParameter(gl.SAMPLES),
            textureUnits: gl.getParameter(gl.TEXTURE0),
        }
    }

    get currentProgram() {
        return this.cache.get('useProgram') as Program;
    }

    createBuffer() {
        return new Buffer(this)
    }
    createRenderBuffer() {
        return new RenderBuffer(this)
    }
    createFrameBuffer() {
        return new FrameBuffer(this)
    }
    createProgram(options: { vs: string, fs: string }) {
        return Program.getProgram(this, options.vs, options.fs) as Program
    }
    useProgram(program: Program) {
        if (this.cache.get('useProgram') === program) {
            return;
        }
        this.cache.set('useProgram', program);
        this.gl.useProgram(program.program);
    }
    enable(cap: Capability) {
        if (this.cache.get(cap) === true) {
            return;
        }
        this.cache.set(cap, true);
        this.gl.enable(this.gl[cap]);
    }
    disable(cap: Capability) {
        if (this.cache.get(cap) === false) {
            return;
        }
        this.cache.set(cap, false);
        this.gl.disable(this.gl[cap]);
    }
    getViewport() {
        return this.cache.get('viewport') || [0, 0, this.gl.canvas.width, this.gl.canvas.height];
    }
    viewport(x: number, y: number, width: number, height: number) {
        if (arrayEquals(this.cache.get('viewport'), [x, y, width, height])) {
            return;
        }
        this.cache.set('viewport', [x, y, width, height]);
        this.gl.viewport(x, y, width, height);
    }
    scissor(x: number, y: number, width: number, height: number) {
        if (arrayEquals(this.cache.get('scissor'), [x, y, width, height])) {
            return;
        }
        this.cache.set('scissor', [x, y, width, height]);
        this.gl.scissor(x, y, width, height);
    }
    getClearColor() {
        return this.cache.get('clearColor') || [0, 0, 0, 1];
    }
    clearColor(color: [r: number, g: number, b: number, a: number]) {
        if (arrayEquals(this.cache.get('clearColor'), color)) {
            return;
        }
        this.cache.set('clearColor', color);
        this.gl.clearColor(color[0], color[1], color[2], color[3]);
    }
    clearDepth(depth: number) {
        if (this.cache.get('clearDepth') === depth) {
            return;
        }
        this.cache.set('clearDepth', depth);
        this.gl.clearDepth(depth);
    }
    clearStencil(stencil: number) {
        if (this.cache.get('clearStencil') === stencil) {
            return;
        }
        this.cache.set('clearStencil', stencil);
        this.gl.clearStencil(stencil);
    }
    colorMask(colorMask: [r: boolean, g: boolean, b: boolean, a: boolean]) {
        if (arrayEquals(this.cache.get('colorMask'), colorMask)) {
            return;
        }
        this.cache.set('colorMask', colorMask);
        this.gl.colorMask(colorMask[0], colorMask[1], colorMask[2], colorMask[3]);
    }
    clear(options: ClearOptions) {
        let mask = 0
        if (options.color) {
            mask |= this.gl.COLOR_BUFFER_BIT;
            this.clearColor(options.color);
            if (options.colorMask) {
                this.colorMask(options.colorMask);
            }
        }
        if (options.depth) {
            mask |= this.gl.DEPTH_BUFFER_BIT;
            this.gl.clearDepth(options.depth);
        }
        if (options.stencil) {
            mask |= this.gl.STENCIL_BUFFER_BIT;
            this.gl.clearStencil(options.stencil);
        }
        this.gl.clear(mask);
    }
    depth(options: DepthOptions) {
        if (options.func) {
            this.depthFunc(options.func);
        }
        if (options.mask) {
            this.depthMask(options.mask);
        }
        if (options.range) {
            this.depthRange(options.range[0], options.range[1]);
        }
    }
    depthFunc(func: ComparisonFunc) {
        if (this.cache.get('depthFunc') === func) {
            return;
        }
        this.cache.set('depthFunc', func);
        const gl = this.gl;
        gl.depthFunc(gl[func]);
    }
    depthMask(mask: boolean) {
        if (this.cache.get('depthMask') === mask) {
            return;
        }
        this.cache.set('depthMask', mask);
        const gl = this.gl;
        gl.depthMask(mask);
    }
    depthRange(near: number, far: number) {
        const depthRange = this.cache.get('depthRange');
        if (depthRange && depthRange.near === near && depthRange.far === far) {
            return;
        }
        this.cache.set('depthRange', { near, far });
        this.gl.depthRange(near, far);
    }
    stencilFunc(func: ComparisonFunc, ref: number, mask: number, face?: CullFaceMode) {
        const prev = this.cache.get('stencilFunc');
        if (prev && prev.func === func && prev.ref === ref && prev.mask === mask && prev.face === face) {
            return;
        }
        this.cache.set('stencilFunc', { func, ref, mask, face });
        const gl = this.gl;
        if (face) {
            gl.stencilFuncSeparate(gl[func], ref, mask, gl[face]);
        }
        else {
            gl.stencilFunc(gl[func], ref, mask);
        }
    }
    stencilMask(mask: number, face?: CubeMapFaces) {
        const prev = this.cache.get('stencilMask');
        if (prev && prev.mask === mask && prev.face === face) {
            return;
        }
        this.cache.set('stencilMask', { mask, face });
        const gl = this.gl;
        if (face) {
            gl.stencilMaskSeparate(gl[face], mask);
        }
        else {
            gl.stencilMask(mask);
        }
    }
    stencilOp(fail: GLenum, zfail: GLenum, zpass: GLenum, face?: CubeMapFaces) {
        const prev = this.cache.get('stencilOp');
        if (prev && prev.fail === fail && prev.zfail === zfail && prev.zpass === zpass && prev.face === face) {
            return;
        }
        this.cache.set('stencilOp', { fail, zfail, zpass, face });
        const gl = this.gl;
        if (face) {
            gl.stencilOpSeparate(gl[face], fail, zfail, zpass);
        }
        else {
            gl.stencilOp(fail, zfail, zpass);
        }
    }
    disableVertexAttribArray(index: number) {
        if (this.cache.get('disableVertexAttribArray') === index) {
            return;
        }
        this.cache.set('disableVertexAttribArray', index);
        this.gl.disableVertexAttribArray(index);
    }
    enableVertexAttribArray(index: number) {
        if (this.cache.get('enableVertexAttribArray') === index) {
            return;
        }
        this.cache.set('enableVertexAttribArray', index);
        this.gl.enableVertexAttribArray(index);
    }
    blend(options: BlendOptions) {
        if (options.equation) {
            this.blendEquation(options.equation);
        }
        if (options.srcAlpha && options.dstAlpha) {
            this.blendFunc(options.src, options.dst);
        }
        if (options.srcAlpha) {
            this.blendFunc(options.srcAlpha, options.dstAlpha);
        }
    }
    blendEquation(modeRGB: BlendEquationMode, modeAlpha?: BlendEquationMode) {
        const blendEquation = this.cache.get('blendEquation');
        if (blendEquation && blendEquation.modeRGB === modeRGB && blendEquation.modeAlpha === modeAlpha) {
            return;
        }
        this.cache.set('blendEquation', { modeRGB, modeAlpha });
        const gl = this.gl;
        if (modeAlpha) {
            gl.blendEquationSeparate(gl[modeRGB], gl[modeAlpha]);
        }
        else {
            gl.blendEquation(gl[modeRGB]);
        }
    }
    blendFunc(src: BlendFuncSrcFactor, dst: BlendFuncDstFactor, srcAlpha?: BlendFuncSrcFactor, dstAlpha?: BlendFuncDstFactor) {
        const blendFunc = this.cache.get('blendFunc');
        if (blendFunc && blendFunc.src === src && blendFunc.dst === dst && blendFunc.srcAlpha === srcAlpha && blendFunc.dstAlpha === dstAlpha) {
            return;
        }
        this.cache.set('blendFunc', { src, dst, srcAlpha, dstAlpha });
        const gl = this.gl;
        if (srcAlpha && dstAlpha) {
            gl.blendFuncSeparate(gl[src], gl[dst], gl[srcAlpha], gl[dstAlpha]);
        }
        else {
            gl.blendFunc(gl[src], gl[dst]);
        }
    }
    activeTexture(texture: number) {
        if (this.cache.get('activeTexture') === texture) {
            return;
        }
        this.cache.set('activeTexture', texture);
        this.gl.activeTexture(this.capabilities.textureUnits + texture);
    }
    bindArrayBuffer(buffer: WebGLBuffer) {
        if (this.cache.get('bindArrayBuffer') === buffer) {
            return;
        }
        this.cache.set('bindArrayBuffer', buffer);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    }
    bindElementBuffer(buffer: WebGLBuffer) {
        if (this.cache.get('bindElementBuffer') === buffer) {
            return;
        }
        this.cache.set('bindElementBuffer', buffer);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer);
    }
    bindFrameBuffer(framebuffer: WebGLFramebuffer) {
        if (this.cache.get('bindFrameBuffer') === framebuffer) {
            return;
        }
        this.cache.set('bindFrameBuffer', framebuffer);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    }
    bindRenderBuffer(renderbuffer: WebGLRenderbuffer) {
        if (this.cache.get('bindRenderbuffer') === renderbuffer) {
            return;
        }
        this.cache.set('bindRenderbuffer', renderbuffer);
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, renderbuffer);
    }
    drawArray(mode: DrawMode, first: number, count: number) {
        const gl = this.gl;
        this.gl.drawArrays(gl[mode], first, count);
    }
    addDisposable(resource: IDisposable) {
        this.resources.add(resource)
    }
    dispose() {
        this.resources.forEach(resource => resource.dispose())
        this.resources.clear()
    }
}
export {
    Context as GLContext
}