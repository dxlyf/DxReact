/**
 * Renderer —— WebGL2 渲染入口
 *
 * 核心职责：
 * - 创建/持有 WebGL2 上下文与 GLState；
 * - 视口、DPR、自动 resize；
 * - SceneCamera UBO 的每帧同步；
 * - 统一 draw() 调度（VAO、纹理单元、uniform、管线状态合并、instanced draw）；
 * - 离屏 render target 管理。
 *
 * 典型帧循环：
 * ```ts
 * function frame() {
 *     renderer.render(camera, () => {
 *         renderer.draw(mesh, { uniforms: { u_model: modelMatrix } });
 *     });
 *     requestAnimationFrame(frame);
 * }
 * ```
 */
import type { Camera } from './Camera';
import { CAMERA_UBO_FLOATS } from './Camera';
import { GL, type DrawOptions, type DrawState, type RendererOptions } from './types';
import { GLState } from './GLState';
import { Program } from './Program';
import { Geometry } from './Geometry';
import { UniformBuffer } from './UniformBuffer';
import type { Framebuffer } from './Framebuffer';
import { DEFAULT_ATTRIB_LOCATIONS, DEFAULT_FRAGMENT, DEFAULT_VERTEX } from './shaders';

export class Renderer {
    readonly canvas: HTMLCanvasElement;
    readonly gl: WebGL2RenderingContext;
    readonly state: GLState;

    /** 当前渲染目标宽度（CSS 像素 × dpr 后的缓冲尺寸） */
    width = 0;
    height = 0;

    pixelRatio: number;
    private autoResize: boolean;
    private resizeObserver: ResizeObserver | null = null;

    /** 画布清屏色 */
    clearColorValue: [number, number, number, number] = [0, 0, 0, 1];
    /** 是否在 beginFrame 自动清屏 */
    autoClear = true;

    /** 已绑定的相机（SceneCamera） */
    camera: Camera | null = null;

    /** 管线默认状态：每次 draw 都以它为基底，再叠加 draw 的 state 覆盖 */
    defaults: Required<Pick<DrawState, 'depthTest' | 'depthMask' | 'cull' | 'blend'>> & Partial<DrawState> = {
        depthTest: true,
        depthMask: true,
        cull: false,
        blend: false,
        depthFunc: GL.LEQUAL,
        cullFace: GL.BACK,
        frontFace: GL.CCW,
        blendSrc: GL.SRC_ALPHA,
        blendDst: GL.ONE_MINUS_SRC_ALPHA,
        colorMask: [true, true, true, true],
        lineWidth: 1,
    };

    private sceneUBO: UniformBuffer;
    private _defaultProgram: Program | null = null;
    private renderTarget: Framebuffer | null = null;
    private rafId = 0;
    private debug: boolean;

    // -----------------------------------------------------------------------
    // 创建
    // -----------------------------------------------------------------------

    constructor(canvas: HTMLCanvasElement | string, options: RendererOptions = {}) {
        this.canvas = typeof canvas === 'string' ? (document.getElementById(canvas) as HTMLCanvasElement) : canvas;
        if (!this.canvas) throw new Error('canvas 不存在');

        const attributes: WebGLContextAttributes = {
            antialias: options.antialias ?? false,
            depth: options.depth ?? true,
            stencil: options.stencil ?? false,
            alpha: options.alpha ?? false,
            premultipliedAlpha: options.premultipliedAlpha ?? false,
            preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
            powerPreference: options.powerPreference ?? 'high-performance',
        };
        const gl = this.canvas.getContext('webgl2', attributes) as WebGL2RenderingContext | null;
        if (!gl) throw new Error('当前环境不支持 WebGL2');
        this.gl = gl;
        this.state = GLState.for(gl);
        // 未在网格中显式提供的属性给“友好默认值”，让内置网格用默认材质即可开箱即用：
        // a_normal 缺省指 +Y；a_color 缺省纯白（否则默认材质的 u_baseColor*a_color 会乘成黑色）。
        gl.vertexAttrib4f(DEFAULT_ATTRIB_LOCATIONS.normal, 0, 1, 0, 0);
        gl.vertexAttrib4f(DEFAULT_ATTRIB_LOCATIONS.color, 1, 1, 1, 1);
        this.debug = options.debug ?? false;
        this.pixelRatio = options.pixelRatio ?? Math.min(window.devicePixelRatio || 1, 2);
        this.autoResize = options.autoResize ?? true;

        this.sceneUBO = new UniformBuffer(gl, CAMERA_UBO_FLOATS);
        this.state.bindUBOBase(0, this.sceneUBO.handle);

        this.resize();
        if (this.autoResize && typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => this.resize());
            this.resizeObserver.observe(this.canvas.parentElement ?? this.canvas);
        }
    }

    // -----------------------------------------------------------------------
    // 尺寸
    // -----------------------------------------------------------------------

    /** 根据 CSS 尺寸 × DPR 更新后备缓冲并设置视口 */
    resize(width?: number, height?: number): void {
        const rect = this.canvas.getBoundingClientRect();
        const w = width ?? Math.max(1, Math.round(rect.width * this.pixelRatio));
        const h = height ?? Math.max(1, Math.round(rect.height * this.pixelRatio));
        if (this.canvas.width !== w) this.canvas.width = w;
        if (this.canvas.height !== h) this.canvas.height = h;
        this.width = w;
        this.height = h;
        this.state.viewport(0, 0, w, h);
        return;
    }

    private syncCamera(): void {
        // 每帧按默认缓冲尺寸同步相机 UBO（画到离屏目标时由 setRenderTarget 另行同步）
        this.syncCameraFor(this.width, this.height);
    }

    // -----------------------------------------------------------------------
    // 帧流程
    // -----------------------------------------------------------------------

    /** 每帧开头：同步相机 UBO，绑定默认缓冲，清屏 */
    beginFrame(): this {
        this.syncCamera();
        this.bindDefaultFramebuffer();
        if (this.autoClear) {
            const [r, g, b, a] = this.clearColorValue;
            this.state.clearColor(r, g, b, a);
            this.state.clearDepth(1);
            this.state.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
        }
        return this;
    }

    endFrame(): this {
        return this;
    }

    /**
     * 便捷帧回调：设置相机 + beginFrame + 执行绘制回调。
     * 绘制完成后再次 requestAnimationFrame 即可形成动画循环。
     */
    render(camera: Camera, frameFn: (renderer: Renderer) => void): this {
        this.setCamera(camera);
        this.beginFrame();
        frameFn(this);
        return this.endFrame();
    }

    /** 开始/停止内置 requestAnimationFrame 渲染循环 */
    start(camera: Camera, frameFn: (renderer: Renderer, dt: number) => void): this {
        this.stop();
        let last = performance.now();
        const loop = (t: number) => {
            this.rafId = requestAnimationFrame(loop);
            const dt = (t - last) / 1000;
            last = t;
            this.render(camera, () => frameFn(this, dt));
        };
        this.rafId = requestAnimationFrame(loop);
        return this;
    }

    stop(): this {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = 0;
        return this;
    }

    // -----------------------------------------------------------------------
    // 相机 / 渲染目标
    // -----------------------------------------------------------------------

    setCamera(camera: Camera): this {
        this.camera = camera;
        return this;
    }

    /** 切换到离屏目标（之后 draw 会渲染到它）；传入 null 回到默认缓冲 */
    setRenderTarget(target: Framebuffer | null): this {
        this.renderTarget = target;
        if (target) {
            target.bind();
            // 相机 UBO 随目标尺寸更新一次，保证画到离屏纹理时投影/宽高比正确
            if (this.camera) this.syncCameraFor(target.width, target.height);
        } else {
            this.bindDefaultFramebuffer();
        }
        return this;
    }

    private bindDefaultFramebuffer(): void {
        const st = this.state;
        st.bindFramebuffer(null);
        st.viewport(0, 0, this.width, this.height);
    }

    /** 将相机按指定视口同步进 UBO（不改动 renderTarget 状态） */
    private syncCameraFor(w: number, h: number): void {
        if (!this.camera) return;
        this.camera.setAspect(w / Math.max(1, h));
        this.camera.copyToSceneData(this.sceneUBO.data, w, h);
        this.sceneUBO.commit();
    }

    /** 清空当前渲染目标 */
    clear(r?: number, g?: number, b?: number, a?: number): this {
        if (r !== undefined) {
            this.clearColorValue = [r, g ?? r, b ?? g ?? r, a ?? 1];
        }
        const [cr, cg, cb, ca] = this.clearColorValue;
        this.state.clearColor(cr, cg, cb, ca);
        this.state.clearDepth(1);
        this.state.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
        return this;
    }

    setClearColor(r: number, g: number, b: number, a = 1): this {
        this.clearColorValue = [r, g, b, a];
        return this;
    }

    // -----------------------------------------------------------------------
    // 资源便捷创建
    // -----------------------------------------------------------------------

    createProgram(vertex: string, fragment: string): Program {
        return new Program(this.gl, vertex, fragment, { debug: this.debug });
    }

    /** 内置默认材质（带方向光 + 贴图开关） */
    get defaultProgram(): Program {
        if (!this._defaultProgram) {
            this._defaultProgram = this.createProgram(DEFAULT_VERTEX, DEFAULT_FRAGMENT);
        }
        return this._defaultProgram;
    }

    // -----------------------------------------------------------------------
    // 绘制
    // -----------------------------------------------------------------------

    /** 使用默认材质绘制几何体 */
    draw(geometry: Geometry, options?: DrawOptions): this;

    /** 使用指定材质绘制几何体 */
    draw(geometry: Geometry, program: Program | null, options?: DrawOptions): this;

    draw(geometry: Geometry, programOrOptions?: Program | DrawOptions | null, maybeOptions?: DrawOptions): this {
        let program: Program | null;
        let options: DrawOptions;
        if (programOrOptions instanceof Program) {
            program = programOrOptions;
            options = maybeOptions ?? {};
        } else {
            program = null;
            options = (programOrOptions ?? {}) as DrawOptions;
        }
        this.drawGeometry(geometry, program ?? this.defaultProgram, options);
        return this;
    }

    private applyDefaultMaterial(prog: Program, opts: DrawOptions): void {
        // 仅在渲染默认材质时填充缺失默认值
        prog.setUniform('u_baseColor', opts.uniforms?.u_baseColor ?? [1, 1, 1, 1]);
        prog.setUniform('u_lightDir', opts.uniforms?.u_lightDir ?? [0.4, 0.9, 0.3]);
        prog.setUniform('u_lightColor', opts.uniforms?.u_lightColor ?? [1, 1, 1]);
        prog.setUniform('u_ambient', opts.uniforms?.u_ambient ?? [0.32, 0.32, 0.34]);
        prog.setUniform('u_hasMap', opts.uniforms?.u_hasMap ?? (opts.textures && 'u_map' in opts.textures ? 1 : 0));
    }

    private drawGeometry(geometry: Geometry, program: Program, options: DrawOptions): void {
        const gl = this.gl;
        const st = this.state;

        // 1. 绑定 program
        st.useProgram(program.program);

        // 2. 相机 UBO：SceneCamera 块已在 Program 构造时绑定到绑定点 0
        if (this.camera) {
            st.bindUBOBase(0, this.sceneUBO.handle);
        }

        // 3. VAO（geometry × program 自动缓存）
        geometry.bind(program, st);

        // 4. 纹理 → 采样器单元
        if (options.textures) {
            let unit = 0;
            const samplerMap = new Map<string, number>();
            for (const meta of program.samplers()) samplerMap.set(meta.name, -1);
            for (const [name, tex] of Object.entries(options.textures)) {
                if (!samplerMap.has(name)) {
                    if (this.debug) console.warn(`Program 没有 sampler uniform: ${name}`);
                    continue;
                }
                if (unit >= st.maxTextureUnits) break;
                tex.bind(unit);
                program.setUniform(name, unit);
                unit++;
            }
        }

        // 5. 管线状态：base + 覆盖
        st.apply(this.defaults);
        if (options.state) st.apply(options.state);

        // 6. uniforms
        if (program === this.defaultProgram) this.applyDefaultMaterial(program, options);
        if (options.uniforms) {
            for (const [name, value] of Object.entries(options.uniforms)) {
                program.setUniform(name, value);
            }
        }

        // 7. draw call
        const mode = options.mode ?? geometry.mode;
        const isIndexed = geometry.isIndexed();
        const count = options.count ?? geometry.drawCount();
        const offset = options.offset ?? 0;
        const instances = options.instances ?? 0;

        if (instances > 1) {
            if (isIndexed) gl.drawElementsInstanced(mode, count, geometry.indexType, offset, instances);
            else gl.drawArraysInstanced(mode, offset, count, instances);
        } else if (isIndexed) {
            gl.drawElements(mode, count, geometry.indexType, offset);
        } else {
            gl.drawArrays(mode, offset, count);
        }
    }

    /** 零属性全屏绘制（配合 FULLSCREEN_VERTEX 的 gl_VertexID 方案） */
    drawFullscreen(program: Program, options?: { uniforms?: DrawOptions['uniforms']; textures?: DrawOptions['textures'] }): this {
        const st = this.state;
        st.useProgram(program.program);
        if (this.camera) st.bindUBOBase(0, this.sceneUBO.handle);
        if (options?.textures) {
            let unit = 0;
            for (const [name, tex] of Object.entries(options.textures)) {
                tex.bind(unit);
                program.setUniform(name, unit);
                unit++;
            }
        }
        if (options?.uniforms) {
            for (const [name, value] of Object.entries(options.uniforms)) program.setUniform(name, value);
        }
        st.apply(this.defaults);
        st.apply({ cull: false, depthTest: false, depthMask: false });
        st.bindVertexArray(null);
        this.gl.drawArrays(GL.TRIANGLES, 0, 3);
        return this;
    }

    // -----------------------------------------------------------------------
    // 清理
    // -----------------------------------------------------------------------

    dispose(): void {
        this.stop();
        this.resizeObserver?.disconnect();
        this._defaultProgram?.dispose();
        this.sceneUBO.dispose();
    }
}
