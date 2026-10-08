import { arrayEquals } from "../utils";
import { Program, type ProgramOptions } from "./program";
import { ArrayType, BlendEquationMode, BlendFuncDstFactor, BlendFuncSrcFactor, BlendOptions, BufferDataUsage, BufferTarget, Capability, ClearOptions, ComparisonFunc, CubeMapFaces, CullFaceMode, DepthOptions, DrawMode, FramebufferAttachment, FrontFaceMode, TexImage2DTarget, TextureTarget } from "./types";
import { DataTexture, Texture, Texture2D, TextureCubeMap, type TextureOptions } from "./textures";
import { Buffer, IndexBuffer, VertexBuffer } from "./buffer";
import { AttributeBuffer, type AttributeBufferOptions } from "./attributes";
import { FrameBuffer } from "./frame_buffer";
import { RenderBuffer, type RenderBufferStorageOptions } from "./render_buffer";
import { UniformBlock, type UniformBlockOptions } from "./uniform_block";
import {EventEmitter,type IDisposable} from '@dxyl/math2'

type ContextEvents={
    'dispose':[ctx:Context]
    'initialize':[ctx:Context]
    'initcontext':[ctx:Context]
    'contextlost':[ctx:Context]
    'contextrestored':[ctx:Context]
}
class Context extends EventEmitter<ContextEvents>{
    gl: WebGL2RenderingContext;
    cache = new Map<string, any>();
    programCache = new Map<string, Program>();
    capabilities: {
        maxTextures: number,
        maxVertexTextures: number,
        maxTextureSize: number,
        maxCubemapSize: number,
        maxAttributes: number,
        maxVertexUniforms: number,
        maxVeryings: number,
        maxFragmentUniforms: number,
        maxSamples: number,
        samples: number,
        /** 可用的纹理单元总数（所有着色阶段合计） */
        maxTextureUnits: number,
    };
    resources = new Set<IDisposable>()
    /** 纹理单元自增游标，allocateTextureUnit() 使用 */
    textureUnits = 0;
    /** 已启用的顶点属性槽位，上下文丢失后清空 */
    protected enabledAttributes = new Set<number>()
    /** canvas 上下文事件回调，dispose 时注销 */
    private onContextLostHandler?: (e: Event) => void
    private onContextRestoredHandler?: (e: Event) => void
    constructor(gl: WebGL2RenderingContext) {
        super()
        this.gl = gl;
        this.capabilities = {
            maxTextures: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
            maxVertexTextures: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
            maxCubemapSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
            maxAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
            maxVertexUniforms: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
            maxVeryings: gl.getParameter(gl.MAX_VARYING_VECTORS),
            maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
            maxSamples: gl.getParameter(gl.MAX_SAMPLES),
            samples: gl.getParameter(gl.SAMPLES),
            maxTextureUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
        }
        this.listenContextEvents()
        this.emit('initialize',this)
        this.initContext()
    }

    /**
     * 监听 canvas 的上下文丢失/恢复事件
     * 注意：必须在 webglcontextlost 里 preventDefault()，浏览器才会派发 webglcontextrestored
     */
    private listenContextEvents() {
        const canvas = this.gl.canvas as HTMLCanvasElement
        if (!canvas || typeof canvas.addEventListener !== 'function') {
            return
        }
        this.onContextLostHandler = (e: Event) => {
            e.preventDefault()
            this.contextLost()
        }
        this.onContextRestoredHandler = () => {
            this.contextRestored()
        }
        canvas.addEventListener('webglcontextlost', this.onContextLostHandler, false)
        canvas.addEventListener('webglcontextrestored', this.onContextRestoredHandler, false)
    }
    private removeContextEvents() {
        const canvas = this.gl.canvas as HTMLCanvasElement
        if (!canvas || typeof canvas.removeEventListener !== 'function') {
            return
        }
        if (this.onContextLostHandler) {
            canvas.removeEventListener('webglcontextlost', this.onContextLostHandler, false)
        }
        if (this.onContextRestoredHandler) {
            canvas.removeEventListener('webglcontextrestored', this.onContextRestoredHandler, false)
        }
    }

    get currentProgram() {
        return this.cache.get('useProgram') as Program;
    }
    initContext(){
        
        this.emit('initcontext',this)
    }
    contextLost(){
        // 上下文丢失后所有 GL 状态缓存与句柄均失效，必须先清空再通知资源
        this.cache.clear()
        this.enabledAttributes.clear()
        this.textureUnits = 0
        this.emit('contextlost',this)
    }
    contextRestored(){
        // 恢复后 GL 状态回到初始值，缓存同样要清空，避免后续绑定被误判为“无变化”而跳过
        this.cache.clear()
        this.textureUnits = 0
        this.emit('contextrestored',this)
    }
    createBuffer(target: BufferTarget = 'ARRAY_BUFFER', usage: BufferDataUsage = 'STATIC_DRAW') {
        return new Buffer(this, target, usage)
    }
    createVertexBuffer(usage: BufferDataUsage = 'STATIC_DRAW') {
        return new VertexBuffer(this, usage)
    }
    createIndexBuffer(usage: BufferDataUsage = 'STATIC_DRAW') {
        return new IndexBuffer(this, usage)
    }
    createAttributeBuffer(options: AttributeBufferOptions) {
        return new AttributeBuffer(this, options)
    }
    createUniformBlock(program: Program, options: UniformBlockOptions) {
        return new UniformBlock(this, program, options)
    }
    createRenderBuffer(width: number, height: number, options?: RenderBufferStorageOptions) {
        return new RenderBuffer(this, width, height, options)
    }
    createFrameBuffer() {
        return new FrameBuffer(this)
    }
    createProgram(options: ProgramOptions) {
        return Program.getProgram(this, options.vs, options.fs, options) as Program
    }
    createTexture(target: TextureTarget = 'TEXTURE_2D', options?: TextureOptions) {
        return new Texture(this, target, options)
    }
    createTexture2D(options?: TextureOptions) {
        return new Texture2D(this, options)
    }
    createTextureCubeMap(options?: TextureOptions) {
        return new TextureCubeMap(this, options)
    }
    createDataTexture(data: ArrayBufferView | null, width: number, height: number, options?: TextureOptions) {
        return new DataTexture(this, data, width, height, options)
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
        if (options.depth !== undefined) {
            mask |= this.gl.DEPTH_BUFFER_BIT;
            this.clearDepth(options.depth);
        }
        if (options.stencil !== undefined) {
            mask |= this.gl.STENCIL_BUFFER_BIT;
            this.clearStencil(options.stencil);
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
        if (!this.enabledAttributes.has(index)) {
            return;
        }
        this.enabledAttributes.delete(index);
        this.gl.disableVertexAttribArray(index);
    }
    enableVertexAttribArray(index: number) {
        if (this.enabledAttributes.has(index)) {
            return;
        }
        this.enabledAttributes.add(index);
        this.gl.enableVertexAttribArray(index);
    }
    /** 查询某个顶点属性槽位当前是否已启用 */
    isVertexAttribArrayEnabled(index: number) {
        return this.enabledAttributes.has(index);
    }
    /** 设置剔除面（需先 enable('CULL_FACE')） */
    cullFace(mode: CullFaceMode) {
        if (this.cache.get('cullFace') === mode) {
            return;
        }
        this.cache.set('cullFace', mode);
        this.gl.cullFace(this.gl[mode]);
    }
    /** 设置正面三角形绕序（CW/CCW），影响 CULL_FACE 剔除方向与 gl_FrontFacing */
    frontFace(mode: FrontFaceMode) {
        if (this.cache.get('frontFace') === mode) {
            return;
        }
        this.cache.set('frontFace', mode);
        this.gl.frontFace(this.gl[mode]);
    }
    /** 一次性设置混合相关状态（方程/常量色/混合因子） */
    blend(options: BlendOptions) {
        if (options.equation) {
            this.blendEquation(options.equation);
        }
        if (options.color) {
            this.blendColor(options.color);
        }
        if (options.src && options.dst) {
            this.blendFunc(options.src, options.dst, options.srcAlpha, options.dstAlpha);
        }
    }
    /** 设置常量混合色，配合 CONSTANT_COLOR / CONSTANT_ALPHA 等因子使用 */
    blendColor(color: [r: number, g: number, b: number, a: number]) {
        if (arrayEquals(this.cache.get('blendColor'), color)) {
            return;
        }
        this.cache.set('blendColor', color);
        this.gl.blendColor(color[0], color[1], color[2], color[3]);
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
    /** 设置多边形偏移量（需先 enable('POLYGON_OFFSET_FILL')），常用于避免深度冲突 */
    polygonOffset(factor: number, units: number) {
        const prev = this.cache.get('polygonOffset');
        if (prev && prev.factor === factor && prev.units === units) {
            return;
        }
        this.cache.set('polygonOffset', { factor, units });
        this.gl.polygonOffset(factor, units);
    }
    /** 设置多重采样覆盖率（需先 enable('SAMPLE_COVERAGE')） */
    sampleCoverage(value: number, invert = false) {
        const prev = this.cache.get('sampleCoverage');
        if (prev && prev.value === value && prev.invert === invert) {
            return;
        }
        this.cache.set('sampleCoverage', { value, invert });
        this.gl.sampleCoverage(value, invert);
    }
    /** 设置线宽（多数 WebGL 实现仅支持 1.0，设置其它值可能被忽略） */
    lineWidth(width: number) {
        if (this.cache.get('lineWidth') === width) {
            return;
        }
        this.cache.set('lineWidth', width);
        this.gl.lineWidth(width);
    }
    /** 从 0 开始依次分配纹理单元，返回本次分配的单元号 */
    allocateTextureUnit(){
        const textureUnit = this.textureUnits;
        if ( textureUnit >= this.capabilities.maxTextureUnits ) {
            console.warn( 'Context: Trying to use ' + textureUnit + ' texture units while this GPU supports only ' + this.capabilities.maxTextureUnits );
        }
        this.textureUnits = textureUnit + 1;
        return textureUnit;
    }
    resetTextureUnits(){
        this.textureUnits = 0;
    }
    /** 激活指定纹理单元（0 起） */
    activeTexture(texture: number) {
        if (this.cache.get('activeTexture') === texture) {
            return;
        }
        this.cache.set('activeTexture', texture);
        this.gl.activeTexture(this.gl.TEXTURE0 + texture);
    }
    /** 通用缓冲区绑定，按 target 分别缓存 */
    bindBuffer(target: BufferTarget, buffer: WebGLBuffer | null) {
        const key = 'bindBuffer:' + target;
        if (this.cache.get(key) === buffer) {
            return;
        }
        this.cache.set(key, buffer);
        this.gl.bindBuffer(this.gl[target], buffer);
    }
    bindArrayBuffer(buffer: WebGLBuffer | null) {
        this.bindBuffer('ARRAY_BUFFER', buffer);
    }
    bindElementBuffer(buffer: WebGLBuffer | null) {
        this.bindBuffer('ELEMENT_ARRAY_BUFFER', buffer);
    }
    bindBufferBase(target: 'UNIFORM_BUFFER' | 'TRANSFORM_FEEDBACK_BUFFER', index: number, buffer: WebGLBuffer) {
        const key = 'bindBufferBase:' + target + ':' + index;
        if (this.cache.get(key) === buffer) {
            return;
        }
        this.cache.set(key, buffer);
        this.gl.bindBufferBase(this.gl[target], index, buffer);
    }
    bindFrameBuffer(framebuffer: WebGLFramebuffer | null) {
        if (this.cache.get('bindFrameBuffer') === framebuffer) {
            return;
        }
        this.cache.set('bindFrameBuffer', framebuffer);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    }
    bindRenderBuffer(renderbuffer: WebGLRenderbuffer | null) {
        if (this.cache.get('bindRenderbuffer') === renderbuffer) {
            return;
        }
        this.cache.set('bindRenderbuffer', renderbuffer);
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, renderbuffer);
    }
    bindTexture(target: TextureTarget, texture: WebGLTexture | null) {
        // 纹理绑定与纹理单元相关，缓存 key 需要带上当前激活的单元
        const unit = this.cache.get('activeTexture') ?? 0;
        const key = 'bindTexture:' + target + ':' + unit;
        if (this.cache.get(key) === texture) {
            return;
        }
        this.cache.set(key, texture);
        this.gl.bindTexture(this.gl[target], texture);
    }
    /** 把纹理挂到当前帧缓冲的附件点上（颜色/深度/模板） */
    framebufferTexture2D(attachment: FramebufferAttachment, textarget: TexImage2DTarget, texture: WebGLTexture | null, level = 0) {
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl[attachment], this.gl[textarget], texture, level);
    }
    /** 把渲染缓冲挂到当前帧缓冲的附件点上（通常用于深度/模板） */
    framebufferRenderbuffer(attachment: FramebufferAttachment, renderbuffer: WebGLRenderbuffer | null) {
        this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl[attachment], this.gl.RENDERBUFFER, renderbuffer);
    }
    drawArray(mode: DrawMode, first: number, count: number) {
        const gl = this.gl;
        gl.drawArrays(gl[mode], first, count);
    }
    /** 按索引绘制（需先绑定 ELEMENT_ARRAY_BUFFER，或由 AttributeBuffer 绑定过索引） */
    drawElements(mode: DrawMode, count: number, type: ArrayType = 'UNSIGNED_SHORT', offset = 0) {
        const gl = this.gl;
        gl.drawElements(gl[mode], count, gl[type], offset);
    }
    /** 实例化绘制（非索引） */
    drawArrayInstanced(mode: DrawMode, first: number, count: number, instanceCount: number) {
        const gl = this.gl;
        gl.drawArraysInstanced(gl[mode], first, count, instanceCount);
    }
    /** 实例化绘制（索引） */
    drawElementsInstanced(mode: DrawMode, count: number, type: ArrayType = 'UNSIGNED_SHORT', offset = 0, instanceCount = 1) {
        const gl = this.gl;
        gl.drawElementsInstanced(gl[mode], count, gl[type], offset, instanceCount);
    }
    
    addDisposable(resource: IDisposable) {
        this.resources.add(resource)
    }
    dispose() {
        this.removeContextEvents()
        this.emit('dispose',this)
        this.resources.forEach(resource => resource.dispose())
        this.resources.clear()
        this.programCache.clear()
        this.cache.clear()
        this.enabledAttributes.clear()
    }
}
export {
    Context
}