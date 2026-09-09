/**
 * GLState —— WebGL2 状态缓存层
 *
 * 作用：
 * - 缓存 program / VAO / framebuffer / buffer / 纹理单元 / 开关等所有冗余 gl 调用，
 *   让上层按“期望状态”声明式编写，而驱动只在真正变化时执行 gl 调用。
 * - 每个 WebGL2 上下文对应唯一实例（通过 GLState.for(gl) 获取），
 *   因此 Texture / Framebuffer / Renderer 各自独立操作也能共享同一份缓存，互不失效。
 */
import { GL, type DrawState } from './types';

export class GLState {
    readonly gl: WebGL2RenderingContext;
    readonly maxTextureUnits: number;

    /** 期望状态（即本次调用时实际写入的状态） */
    program: WebGLProgram | null = null;
    vao: WebGLVertexArrayObject | null = null;
    framebuffer: WebGLFramebuffer | null = null;

    private enabledCaps = new Map<number, boolean>();

    /** 按目标跟踪绑定的 buffer（ARRAY_BUFFER/ELEMENT_ARRAY_BUFFER/...） */
    private boundBuffers = new Map<number, WebGLBuffer | null>();

    /** 绑定在 UBO 绑定点上的 buffer */
    private boundUBOBases: (WebGLBuffer | null)[] = [];

    private activeTextureUnit = 0;
    private unitTargetBindings: Array<Map<number, WebGLTexture | null>> = [];

    private lastViewport: [number, number, number, number] | null = null;
    private lastScissor: [number, number, number, number] | null = null;
    private lastClearColor: [number, number, number, number] | null = null;
    private lastClearDepth: number | null = null;
    private lastClearStencil: number | null = null;
    private lastDepthFunc: number | null = null;
    private lastDepthMask: boolean | null = null;
    private lastColorMask: [boolean, boolean, boolean, boolean] | null = null;
    private lastCullFace: number | null = null;
    private lastFrontFace: number | null = null;
    private lastBlendSrc: number = GL.SRC_ALPHA;
    private lastBlendDst: number = GL.ONE_MINUS_SRC_ALPHA;
    private lastBlendSrcA: number = GL.SRC_ALPHA;
    private lastBlendDstA: number = GL.ONE_MINUS_SRC_ALPHA;
    private lastBlendEquation: number | null = null;
    private lastLineWidth: number | null = null;
    private lastPolygonOffset: [number, number] | null = null;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) as number;
        for (let i = 0; i < this.maxTextureUnits; i++) {
            this.unitTargetBindings.push(new Map());
        }
        this.boundUBOBases.length = 0;
    }

    // ---- 注册表 ------------------------------------------------------------

    private static registry = new WeakMap<WebGL2RenderingContext, GLState>();

    /** 获取 / 创建某上下文的缓存状态 */
    static for(gl: WebGL2RenderingContext): GLState {
        let s = GLState.registry.get(gl);
        if (!s) {
            s = new GLState(gl);
            GLState.registry.set(gl, s);
        }
        return s;
    }

    // ---- Program / VAO / FBO ----------------------------------------------

    useProgram(p: WebGLProgram | null): void {
        if (this.program !== p) {
            this.program = p;
            this.gl.useProgram(p);
        }
    }

    bindVertexArray(vao: WebGLVertexArrayObject | null): void {
        if (this.vao !== vao) {
            this.vao = vao;
            this.gl.bindVertexArray(vao);
        }
    }

    bindFramebuffer(fb: WebGLFramebuffer | null): void {
        if (this.framebuffer !== fb) {
            this.framebuffer = fb;
            this.gl.bindFramebuffer(GL.FRAMEBUFFER, fb);
        }
    }

    // ---- Buffer ------------------------------------------------------------

    bindBuffer(target: number, buffer: WebGLBuffer | null): void {
        if (this.boundBuffers.get(target) !== buffer) {
            this.boundBuffers.set(target, buffer);
            this.gl.bindBuffer(target, buffer);
        }
    }

    bindUBOBase(index: number, buffer: WebGLBuffer | null): void {
        if (this.boundUBOBases[index] !== buffer) {
            this.boundUBOBases[index] = buffer;
            if (buffer) this.gl.bindBufferBase(GL.UNIFORM_BUFFER, index, buffer);
            else this.gl.bindBufferBase(GL.UNIFORM_BUFFER, index, null);
        }
    }

    // ---- 能力开关 ----------------------------------------------------------

    setEnabled(cap: number, on: boolean): void {
        if (this.enabledCaps.get(cap) !== on) {
            this.enabledCaps.set(cap, on);
            if (on) this.gl.enable(cap);
            else this.gl.disable(cap);
        }
    }

    isEnabled(cap: number): boolean {
        return this.enabledCaps.get(cap) ?? false;
    }

    // ---- 纹理 --------------------------------------------------------------

    setActiveTextureUnit(unit: number): void {
        if (this.activeTextureUnit !== unit) {
            this.activeTextureUnit = unit;
            this.gl.activeTexture(GL.TEXTURE0 + unit);
        }
    }

    getActiveTextureUnit(): number {
        return this.activeTextureUnit;
    }

    /** 在当前（或指定）纹理单元上绑定 2D 纹理 */
    bindTexture2D(texture: WebGLTexture | null, unit = this.activeTextureUnit): void {
        this.setActiveTextureUnit(unit);
        this.bindTextureTarget(GL.TEXTURE_2D, texture);
    }

    /** 绑定任意目标纹理；target 参与缓存键，避免 2D/Cube/3D 互相污染 */
    bindTextureTarget(target: number, texture: WebGLTexture | null, unit = this.activeTextureUnit): void {
        this.setActiveTextureUnit(unit);
        const slot = this.unitTargetBindings[unit];
        if (!slot) return;
        if (slot.get(target) !== texture) {
            slot.set(target, texture);
            this.gl.bindTexture(target, texture);
        }
    }

    // ---- Viewport / Scissor -----------------------------------------------

    viewport(x: number, y: number, w: number, h: number): void {
        if (
            !this.lastViewport ||
            this.lastViewport[0] !== x ||
            this.lastViewport[1] !== y ||
            this.lastViewport[2] !== w ||
            this.lastViewport[3] !== h
        ) {
            this.lastViewport = [x, y, w, h];
            this.gl.viewport(x, y, w, h);
        }
    }

    scissor(x: number, y: number, w: number, h: number): void {
        if (
            !this.lastScissor ||
            this.lastScissor[0] !== x ||
            this.lastScissor[1] !== y ||
            this.lastScissor[2] !== w ||
            this.lastScissor[3] !== h
        ) {
            this.lastScissor = [x, y, w, h];
            this.gl.scissor(x, y, w, h);
        }
    }

    // ---- 清除色/深度/模板 --------------------------------------------------

    clearColor(r: number, g: number, b: number, a: number): void {
        if (
            !this.lastClearColor ||
            this.lastClearColor[0] !== r ||
            this.lastClearColor[1] !== g ||
            this.lastClearColor[2] !== b ||
            this.lastClearColor[3] !== a
        ) {
            this.lastClearColor = [r, g, b, a];
            this.gl.clearColor(r, g, b, a);
        }
    }

    clearDepth(d: number): void {
        if (this.lastClearDepth !== d) {
            this.lastClearDepth = d;
            this.gl.clearDepth(d);
        }
    }

    clearStencil(s: number): void {
        if (this.lastClearStencil !== s) {
            this.lastClearStencil = s;
            this.gl.clearStencil(s);
        }
    }

    clear(mask: number): void {
        this.gl.clear(mask);
    }

    // ---- 深度 / 颜色 / 面 --------------------------------------------------

    depthFunc(fn: number): void {
        if (this.lastDepthFunc !== fn) {
            this.lastDepthFunc = fn;
            this.gl.depthFunc(fn);
        }
    }

    depthMask(write: boolean): void {
        if (this.lastDepthMask !== write) {
            this.lastDepthMask = write;
            this.gl.depthMask(write);
        }
    }

    colorMask(r: boolean, g: boolean, b: boolean, a: boolean): void {
        if (
            !this.lastColorMask ||
            this.lastColorMask[0] !== r ||
            this.lastColorMask[1] !== g ||
            this.lastColorMask[2] !== b ||
            this.lastColorMask[3] !== a
        ) {
            this.lastColorMask = [r, g, b, a];
            this.gl.colorMask(r, g, b, a);
        }
    }

    cullFace(face: number): void {
        if (this.lastCullFace !== face) {
            this.lastCullFace = face;
            this.gl.cullFace(face);
        }
    }

    frontFace(mode: number): void {
        if (this.lastFrontFace !== mode) {
            this.lastFrontFace = mode;
            this.gl.frontFace(mode);
        }
    }

    // ---- 混合 --------------------------------------------------------------

    blendFunc(s: number, d: number, sa?: number, da?: number): void {
        const srcA = sa ?? s;
        const dstA = da ?? d;
        if (
            this.lastBlendSrc !== s ||
            this.lastBlendDst !== d ||
            this.lastBlendSrcA !== srcA ||
            this.lastBlendDstA !== dstA
        ) {
            this.lastBlendSrc = s;
            this.lastBlendDst = d;
            this.lastBlendSrcA = srcA;
            this.lastBlendDstA = dstA;
            this.gl.blendFuncSeparate(s, d, srcA, dstA);
        }
    }

    blendEquation(eq: number): void {
        if (this.lastBlendEquation !== eq) {
            this.lastBlendEquation = eq;
            this.gl.blendEquation(eq);
        }
    }

    // ---- 其它 --------------------------------------------------------------

    lineWidth(w: number): void {
        if (this.lastLineWidth !== w) {
            this.lastLineWidth = w;
            this.gl.lineWidth(w);
        }
    }

    polygonOffset(factor: number, units: number): void {
        if (
            !this.lastPolygonOffset ||
            this.lastPolygonOffset[0] !== factor ||
            this.lastPolygonOffset[1] !== units
        ) {
            this.lastPolygonOffset = [factor, units];
            this.gl.polygonOffset(factor, units);
        }
    }

    /**
     * 根据“期望状态”刷新各类开关。只刷新有值的字段，常用于 draw 前。
     * 返回是否刷新了任何状态。
     */
    apply(state: Partial<DrawState>): void {
        if (state.depthTest !== undefined) this.setEnabled(GL.DEPTH_TEST, state.depthTest);
        if (state.depthMask !== undefined) this.depthMask(state.depthMask);
        if (state.depthFunc !== undefined) this.depthFunc(state.depthFunc);

        if (state.cull !== undefined) {
            this.setEnabled(GL.CULL_FACE, state.cull);
            if (state.cullFace !== undefined) this.cullFace(state.cullFace);
            if (state.frontFace !== undefined) this.frontFace(state.frontFace);
        } else {
            if (state.cullFace !== undefined) this.cullFace(state.cullFace);
            if (state.frontFace !== undefined) this.frontFace(state.frontFace);
        }

        if (state.blend !== undefined) this.setEnabled(GL.BLEND, state.blend);
        if (state.blendSrc !== undefined || state.blendDst !== undefined) {
            const s = state.blendSrc ?? this.lastBlendSrc;
            const d = state.blendDst ?? this.lastBlendDst;
            this.blendFunc(s, d, state.blendSrcAlpha, state.blendDstAlpha);
        }

        if (state.colorMask) {
            this.colorMask(state.colorMask[0], state.colorMask[1], state.colorMask[2], state.colorMask[3]);
        }
        if (state.lineWidth !== undefined) this.lineWidth(state.lineWidth);
        if (state.polygonOffset !== undefined) {
            this.setEnabled(GL.POLYGON_OFFSET_FILL, true);
            this.polygonOffset(state.polygonOffset[0], state.polygonOffset[1]);
        }
    }
}
