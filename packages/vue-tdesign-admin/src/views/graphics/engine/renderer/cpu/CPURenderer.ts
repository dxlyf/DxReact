/**
 * CPU 光栅化系统 —— WebGL 风格渲染器（纯 CPU 实现）。
 *
 * 这是学习 WebGL 原理的桥梁：API 与 WebGL 1/2 对齐，光栅化全部在 CPU 完成
 * （真实管线见 {@link Rasterizer}）。用法与 WebGL 完全一致：
 *
 * ```ts
 * const gl = new CPURenderer({ width: 300, height: 150 })
 *
 * // 1. 编译着色器（"源码"是 JS 对象，代替 GLSL 字符串）
 * const vs = gl.createShader(gl.VERTEX_SHADER)
 * gl.shaderSource(vs, colorVertexStage)
 * gl.compileShader(vs)
 * const fs = gl.createShader(gl.FRAGMENT_SHADER)
 * gl.shaderSource(fs, colorFragmentStage)
 * gl.compileShader(fs)
 * const program = gl.createProgram()
 * gl.attachShader(program, vs)
 * gl.attachShader(program, fs)
 * gl.linkProgram(program)
 * gl.useProgram(program)
 *
 * // 2. 顶点缓冲 + VAO（attribute 布局记录在 VAO，同 WebGL2）
 * const vao = gl.createVertexArray()
 * gl.bindVertexArray(vao)
 * const vbo = gl.createBuffer()
 * gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
 * gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...]), gl.STATIC_DRAW)
 * const aPos = gl.getAttribLocation(program, 'aPosition')
 * gl.enableVertexAttribArray(aPos)
 * gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
 *
 * // 3. uniform + 绘制
 * gl.uniform4f(gl.getUniformLocation(program, 'uColor'), 1, 0, 0, 1)
 * gl.clearColor(0, 0, 0, 1)
 * gl.clear(gl.COLOR_BUFFER_BIT)
 * gl.drawArrays(gl.TRIANGLES, 0, 3)
 *
 * // 4. 回读像素（WebGL 左下原点约定）
 * const pixels = new Uint8Array(300 * 150 * 4)
 * gl.readPixels(0, 0, 300, 150, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
 * ```
 *
 * 与真实 WebGL 的关键一致性：
 * - 常量名与取值（ARRAY_BUFFER / TRIANGLES / SRC_ALPHA / ...）对齐 WebGL。
 * - `viewport` 与 `readPixels` 使用左下角原点约定（真实 GL 语义）。
 * - `ELEMENT_ARRAY_BUFFER` 绑定与 attribute 布局记录在 VAO 中（WebGL2 行为）。
 * - 混合方程 out = src*srcFactor + dst*dstFactor，因子来自 `blendFunc`。
 * - 错误通过 `getError()` 返回错误码（与真实 gl 一样静默，不抛异常）。
 */
import { CPUFramebuffer } from './Framebuffer'
import { Mat4, Vec2, Vec3, Vec4 } from './math'
import { Rasterizer } from './Rasterizer'
import type { ClipVertex } from './Rasterizer'
import { AttribView } from './types'
import type { BlendFactorFn, DepthFunc, DrawMode, FragmentStageSource, ShaderProgram, Uniforms, VertexStageSource } from './types'

/** CPU 着色器对象（模拟 gl.createShader 的结果） */
export interface CPUShader {
    type: number
    source: VertexStageSource | FragmentStageSource | null
    compiled: boolean
    infoLog: string
}

/** CPU 程序对象（模拟 gl.createProgram 的结果） */
export interface CPUProgram {
    shaders: (CPUShader | null)[]
    linked: boolean
    infoLog: string
    /** 链接成功后生成的可执行对象 */
    executable: ShaderProgram | null
    /** 链接后收集的 active uniform 名（顶点+片元，去重保持声明顺序） */
    activeUniforms: string[]
    /** 该程序保存的 uniform 值（draw 时传入顶点/片元着色器） */
    uniforms: Uniforms
}

/** CPU 缓冲对象（模拟 gl.createBuffer 的结果） */
export interface CPUBuffer {
    data: Float32Array | Uint16Array | Uint32Array | null
    usage: number
}

/** attribute 指针（对应 gl.vertexAttribPointer 参数） */
export interface AttribPointer {
    buffer: CPUBuffer | null
    /** 1/2/3/4 个分量 */
    size: number
    type: number
    normalized: boolean
    /** 字节步长；0 = 紧凑排列 */
    stride: number
    /** 字节偏移 */
    offset: number
}

/** CPU VAO（模拟 gl.createVertexArray 的结果，WebGL2 行为） */
export interface CPUVertexArray {
    /** 按 location 记录的 attribute 指针 */
    attribs: (AttribPointer | null)[]
    /** 按 location 记录的启用状态 */
    enabled: boolean[]
    /** VAO 自己的 ELEMENT_ARRAY_BUFFER 绑定 */
    elementBuffer: CPUBuffer | null
}

/** uniform 位置句柄（模拟 gl.getUniformLocation 的结果） */
export interface CPUUniformLocation {
    program: CPUProgram
    name: string
}

/** CPU FBO（模拟 gl.createFramebuffer 的结果） */
export interface CPUFrameBufferObject {
    framebuffer: CPUFramebuffer
}

export interface CPURendererOptions {
    width?: number
    height?: number
}

// ---------- 内部工具：深度函数 / 混合因子 / 绘制模式 ----------

const DEPTH_FUNCS: Record<number, DepthFunc> = {
    0x0200: 'never', // NEVER
    0x0201: 'less', // LESS
    0x0202: 'equal', // EQUAL
    0x0203: 'lequal', // LEQUAL
    0x0204: 'greater', // GREATER
    0x0205: 'notequal', // NOTEQUAL
    0x0206: 'gequal', // GEQUAL
    0x0207: 'always', // ALWAYS
}

/**
 * 混合因子常量 -> 系数函数。
 * 对应 WebGL 的 blendFunc 因子：
 * SRC_COLOR 仅影响 rgb，alpha 因子恒为 1（规格如此）。
 */
function blendFactorFn(constant: number): BlendFactorFn {
    switch (constant) {
        case 0x0000: // ZERO
            return () => new Vec4(0, 0, 0, 0)
        case 0x0001: // ONE
            return () => new Vec4(1, 1, 1, 1)
        case 0x0300: // SRC_COLOR
            return (s) => new Vec4(s.x, s.y, s.z, 1)
        case 0x0301: // ONE_MINUS_SRC_COLOR
            return (s) => new Vec4(1 - s.x, 1 - s.y, 1 - s.z, 1)
        case 0x0302: // SRC_ALPHA
            return (s) => new Vec4(s.w, s.w, s.w, s.w)
        case 0x0303: // ONE_MINUS_SRC_ALPHA
            return (s) => new Vec4(1 - s.w, 1 - s.w, 1 - s.w, 1 - s.w)
        case 0x0304: // DST_ALPHA
            return (_s, d) => new Vec4(d.w, d.w, d.w, d.w)
        case 0x0305: // ONE_MINUS_DST_ALPHA
            return (_s, d) => new Vec4(1 - d.w, 1 - d.w, 1 - d.w, 1 - d.w)
        default:
            return () => new Vec4(0, 0, 0, 0)
    }
}

/**
 * WebGL 风格 CPU 渲染器。
 * 除 strips/fans/loop 由渲染器展开为基本图元外，API 与 WebGL 一致。
 */
export class CPURenderer {
    // ==================== WebGL 常量（挂在实例上，与真实 gl 一致）====================

    // 错误码
    readonly NO_ERROR = 0
    readonly INVALID_ENUM = 0x0500
    readonly INVALID_VALUE = 0x0501
    readonly INVALID_OPERATION = 0x0502
    readonly OUT_OF_MEMORY = 0x0505

    // 缓冲目标与用法
    readonly ARRAY_BUFFER = 0x8892
    readonly ELEMENT_ARRAY_BUFFER = 0x8893
    readonly STATIC_DRAW = 0x88e4
    readonly DYNAMIC_DRAW = 0x88e8
    readonly STREAM_DRAW = 0x88e0

    // attribute 类型
    readonly FLOAT = 0x1406
    readonly UNSIGNED_BYTE = 0x1401
    readonly UNSIGNED_SHORT = 0x1403
    readonly UNSIGNED_INT = 0x1405

    // 图元类型
    readonly POINTS = 0x0000
    readonly LINES = 0x0001
    readonly LINE_LOOP = 0x0002
    readonly LINE_STRIP = 0x0003
    readonly TRIANGLES = 0x0004
    readonly TRIANGLE_STRIP = 0x0005
    readonly TRIANGLE_FAN = 0x0006

    // 着色器
    readonly VERTEX_SHADER = 0x8b31
    readonly FRAGMENT_SHADER = 0x8b30
    readonly COMPILE_STATUS = 0x8b81
    readonly LINK_STATUS = 0x8b82
    readonly DELETE_STATUS = 0x8b80

    // 能力开关
    readonly DEPTH_TEST = 0x0b71
    readonly BLEND = 0x0be2
    readonly CULL_FACE = 0x0b44

    // 深度比较函数
    readonly NEVER = 0x0200
    readonly LESS = 0x0201
    readonly EQUAL = 0x0202
    readonly LEQUAL = 0x0203
    readonly GREATER = 0x0204
    readonly NOTEQUAL = 0x0205
    readonly GEQUAL = 0x0206
    readonly ALWAYS = 0x0207

    // 清除标志
    readonly COLOR_BUFFER_BIT = 0x00004000
    readonly DEPTH_BUFFER_BIT = 0x00000100

    // 混合因子
    readonly ZERO = 0x0000
    readonly ONE = 0x0001
    readonly SRC_COLOR = 0x0300
    readonly ONE_MINUS_SRC_COLOR = 0x0301
    readonly SRC_ALPHA = 0x0302
    readonly ONE_MINUS_SRC_ALPHA = 0x0303
    readonly DST_ALPHA = 0x0304
    readonly ONE_MINUS_DST_ALPHA = 0x0305
    readonly FUNC_ADD = 0x8006

    // 绕序 / 面
    readonly CW = 0x0900
    readonly CCW = 0x0901
    readonly FRONT = 0x0404
    readonly BACK = 0x0405
    readonly FRONT_AND_BACK = 0x0408

    // 帧缓冲
    readonly FRAMEBUFFER = 0x8d40
    readonly FRAMEBUFFER_COMPLETE = 0x8cd5
    readonly COLOR_ATTACHMENT0 = 0x8ce0
    readonly RGBA = 0x1908

    // ==================== 内部状态 ====================

    /** 默认帧缓冲 */
    readonly defaultFramebuffer: CPUFramebuffer

    private framebufferBinding: CPUFrameBufferObject | null = null
    private currentProgram: CPUProgram | null = null
    private currentVAO: CPUVertexArray
    private readonly defaultVAO: CPUVertexArray
    private arrayBufferBinding: CPUBuffer | null = null

    /** WebGL 语义视口（左下原点） */
    private viewportGL = { x: 0, y: 0, width: 0, height: 0 }
    /** 传给 Rasterizer 的视口（左上原点，与内部帧缓冲一致） */
    private viewportRaster = { x: 0, y: 0, width: 0, height: 0 }

    private clearColorValue: [number, number, number, number] = [0, 0, 0, 1]
    private clearDepthValue = 1

    private caps: Record<number, boolean> = {
        [this.DEPTH_TEST]: false,
        [this.BLEND]: false,
        [this.CULL_FACE]: false,
    }
    private cullFaceMode = this.BACK
    private frontFaceDir = this.CCW
    private depthFuncValue = this.LESS
    private blendSrc = this.ONE
    private blendDst = this.ZERO

    private error = 0

    // 资源追踪（便于 destroy() 清理）
    private shaders = new Set<CPUShader>()
    private programs = new Set<CPUProgram>()
    private buffers = new Set<CPUBuffer>()
    private vaos = new Set<CPUVertexArray>()
    private fbos = new Set<CPUFrameBufferObject>()

    constructor(options: CPURendererOptions = {}) {
        const width = options.width ?? 300
        const height = options.height ?? 150
        this.defaultFramebuffer = new CPUFramebuffer(width, height)
        this.defaultVAO = this.makeVAO()
        this.currentVAO = this.defaultVAO
        this.viewport(0, 0, width, height)
    }

    private makeVAO(): CPUVertexArray {
        return { attribs: [], enabled: [], elementBuffer: null }
    }

    // ==================== 错误 ====================

    private setError(code: number): void {
        if (this.error === 0) this.error = code
    }

    /** 返回并清除错误码（与真实 gl.getError 一致） */
    getError(): number {
        const e = this.error
        this.error = 0
        return e
    }

    // ==================== 着色器 ====================

    createShader(type: number): CPUShader | null {
        if (type !== this.VERTEX_SHADER && type !== this.FRAGMENT_SHADER) {
            this.setError(this.INVALID_ENUM)
            return null
        }
        const shader: CPUShader = { type, source: null, compiled: false, infoLog: '' }
        this.shaders.add(shader)
        return shader
    }

    /** "源码"为 JS 对象（VertexStageSource / FragmentStageSource），代替 GLSL 字符串 */
    shaderSource(shader: CPUShader, source: VertexStageSource | FragmentStageSource): void {
        shader.source = source
        shader.compiled = false
    }

    compileShader(shader: CPUShader): void {
        if (!shader.source) {
            shader.compiled = false
            shader.infoLog = 'shader source is empty'
            this.setError(this.INVALID_OPERATION)
            return
        }
        shader.compiled = true
        shader.infoLog = ''
    }

    getShaderParameter(shader: CPUShader, pname: number): boolean | number {
        if (pname === this.COMPILE_STATUS) return shader.compiled
        if (pname === this.DELETE_STATUS) return !this.shaders.has(shader)
        return false
    }

    getShaderInfoLog(shader: CPUShader): string {
        return shader.infoLog
    }

    deleteShader(shader: CPUShader): void {
        this.shaders.delete(shader)
    }

    // ==================== 程序 ====================

    createProgram(): CPUProgram {
        const program: CPUProgram = {
            shaders: [],
            linked: false,
            infoLog: '',
            executable: null,
            activeUniforms: [],
            uniforms: {},
        }
        this.programs.add(program)
        return program
    }

    attachShader(program: CPUProgram, shader: CPUShader): void {
        program.shaders.push(shader)
        program.linked = false
    }

    linkProgram(program: CPUProgram): void {
        const vs = program.shaders.find((s) => s?.type === this.VERTEX_SHADER)
        const fs = program.shaders.find((s) => s?.type === this.FRAGMENT_SHADER)
        if (!vs?.compiled || !fs?.compiled || !vs.source || !fs.source) {
            program.linked = false
            program.executable = null
            program.activeUniforms = []
            program.infoLog = '需要已编译的顶点与片元着色器'
            return
        }
        const v = vs.source as VertexStageSource
        const f = fs.source as FragmentStageSource
        program.executable = { attribs: v.attribs, vertex: v.main, fragment: f.main }
        // 收集 active uniform（顶点+片元声明，去重保持顺序），供 getUniformLocation 校验
        const active: string[] = []
        for (const list of [v.uniforms, f.uniforms]) {
            for (const name of list ?? []) {
                if (!active.includes(name)) active.push(name)
            }
        }
        program.activeUniforms = active
        program.uniforms = {}
        program.linked = true
        program.infoLog = ''
    }

    getProgramParameter(program: CPUProgram, pname: number): boolean {
        if (pname === this.LINK_STATUS) return program.linked
        if (pname === this.DELETE_STATUS) return !this.programs.has(program)
        return false
    }

    getProgramInfoLog(program: CPUProgram): string {
        return program.infoLog
    }

    useProgram(program: CPUProgram | null): void {
        this.currentProgram = program
    }

    deleteProgram(program: CPUProgram): void {
        this.programs.delete(program)
        if (this.currentProgram === program) this.currentProgram = null
    }

    /** 返回 attribute location（= attribs 声明顺序的索引），未找到返回 -1 */
    getAttribLocation(program: CPUProgram, name: string): number {
        const attribs = program.executable?.attribs
        if (!attribs) return -1
        return attribs.findIndex((a) => a.name === name)
    }

    /**
     * 返回 uniform 位置（对应 gl.getUniformLocation）。
     * 与 WebGL 一致：程序未链接或 name 非 active uniform 时返回 null。
     */
    getUniformLocation(program: CPUProgram, name: string): CPUUniformLocation | null {
        if (!program.executable || !program.activeUniforms.includes(name)) return null
        return { program, name }
    }

    // ==================== uniform 设置 ====================

    uniform1f(loc: CPUUniformLocation, x: number): void {
        loc.program.uniforms[loc.name] = x
    }
    uniform1i(loc: CPUUniformLocation, x: number): void {
        loc.program.uniforms[loc.name] = x
    }
    uniform2f(loc: CPUUniformLocation, x: number, y: number): void {
        loc.program.uniforms[loc.name] = new Vec2(x, y)
    }
    uniform3f(loc: CPUUniformLocation, x: number, y: number, z: number): void {
        loc.program.uniforms[loc.name] = new Vec3(x, y, z)
    }
    uniform4f(loc: CPUUniformLocation, x: number, y: number, z: number, w: number): void {
        loc.program.uniforms[loc.name] = new Vec4(x, y, z, w)
    }
    /** mat3 以 Float32Array(9) 存储 */
    uniformMatrix3fv(loc: CPUUniformLocation, _transpose: boolean, value: Float32Array): void {
        loc.program.uniforms[loc.name] = new Float32Array(value.slice(0, 9))
    }
    /** mat4 转为 {@link Mat4}（列主序，与 gl-matrix/WebGL 一致） */
    uniformMatrix4fv(loc: CPUUniformLocation, _transpose: boolean, value: Float32Array): void {
        loc.program.uniforms[loc.name] = new Mat4(value.slice(0, 16))
    }

    // ==================== 缓冲 ====================

    createBuffer(): CPUBuffer {
        const buffer: CPUBuffer = { data: null, usage: this.STATIC_DRAW }
        this.buffers.add(buffer)
        return buffer
    }

    deleteBuffer(buffer: CPUBuffer): void {
        this.buffers.delete(buffer)
        if (this.arrayBufferBinding === buffer) this.arrayBufferBinding = null
        for (const vao of this.vaos) {
            if (vao.elementBuffer === buffer) vao.elementBuffer = null
            for (const ptr of vao.attribs) {
                if (ptr?.buffer === buffer) ptr.buffer = null
            }
        }
    }

    bindBuffer(target: number, buffer: CPUBuffer | null): void {
        if (target === this.ARRAY_BUFFER) {
            this.arrayBufferBinding = buffer
        } else if (target === this.ELEMENT_ARRAY_BUFFER) {
            // WebGL2：ELEMENT_ARRAY_BUFFER 绑定属于 VAO 状态
            this.currentVAO.elementBuffer = buffer
        } else {
            this.setError(this.INVALID_ENUM)
        }
    }

    /**
     * 上传数据到当前绑定缓冲。
     * 顶点缓冲转为 Float32Array；索引缓冲自动选择 Uint16/Uint32。
     * data 为 number 时表示分配 size 字节（WebGL 的 bufferData(target, size, usage)）。
     */
    bufferData(target: number, data: ArrayLike<number> | number, usage: number): void {
        const buffer = target === this.ARRAY_BUFFER ? this.arrayBufferBinding : this.currentVAO.elementBuffer
        if (!buffer) {
            this.setError(this.INVALID_OPERATION)
            return
        }
        buffer.usage = usage
        if (typeof data === 'number') {
            buffer.data = new Float32Array(data / 4)
            return
        }
        if (target === this.ELEMENT_ARRAY_BUFFER) {
            const arr = Array.from(data)
            buffer.data = Math.max(...arr) > 0xffff ? Uint32Array.from(arr) : Uint16Array.from(arr)
        } else {
            buffer.data = data instanceof Float32Array ? data : Float32Array.from(data)
        }
    }

    bufferSubData(target: number, offsetBytes: number, data: ArrayLike<number>): void {
        const buffer = target === this.ARRAY_BUFFER ? this.arrayBufferBinding : this.currentVAO.elementBuffer
        if (!buffer?.data) {
            this.setError(this.INVALID_OPERATION)
            return
        }
        const start = offsetBytes / 4
        for (let i = 0; i < data.length; i++) {
            buffer.data[start + i] = data[i]
        }
    }

    // ==================== VAO ====================

    createVertexArray(): CPUVertexArray {
        const vao = this.makeVAO()
        this.vaos.add(vao)
        return vao
    }

    deleteVertexArray(vao: CPUVertexArray): void {
        this.vaos.delete(vao)
        if (this.currentVAO === vao) this.currentVAO = this.defaultVAO
    }

    bindVertexArray(vao: CPUVertexArray | null): void {
        this.currentVAO = vao ?? this.defaultVAO
    }

    enableVertexAttribArray(index: number): void {
        this.currentVAO.enabled[index] = true
    }

    disableVertexAttribArray(index: number): void {
        this.currentVAO.enabled[index] = false
    }

    /** 记录 attribute 布局到当前 VAO（stride/offset 为字节，同 WebGL） */
    vertexAttribPointer(index: number, size: number, type: number, normalized: boolean, stride: number, offset: number): void {
        if (type !== this.FLOAT) {
            this.setError(this.INVALID_ENUM)
            return
        }
        if (size < 1 || size > 4 || stride < 0 || offset < 0) {
            this.setError(this.INVALID_VALUE)
            return
        }
        this.currentVAO.attribs[index] = {
            buffer: this.arrayBufferBinding,
            size,
            type,
            normalized,
            stride,
            offset,
        }
    }

    // ==================== 渲染状态 ====================

    /** 设置视口。WebGL 语义：x/y 为左下角原点（真实 GL 约定） */
    viewport(x: number, y: number, width: number, height: number): void {
        this.viewportGL = { x, y, width, height }
        const fb = this.framebuffer
        // 内部帧缓冲为左上原点，转换 y（右下角对齐）
        this.viewportRaster = { x, y: fb.height - (y + height), width, height }
    }

    getViewport(): { x: number; y: number; width: number; height: number } {
        return { ...this.viewportGL }
    }

    clearColor(r: number, g: number, b: number, a = 1): void {
        this.clearColorValue = [r, g, b, a]
    }

    clearDepth(depth: number): void {
        this.clearDepthValue = depth
    }

    /** 清除颜色/深度缓冲（mask 为 COLOR_BUFFER_BIT | DEPTH_BUFFER_BIT） */
    clear(mask: number): void {
        if (mask & this.COLOR_BUFFER_BIT) {
            const [r, g, b, a] = this.clearColorValue
            this.framebuffer.clearColor(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), Math.round(a * 255))
        }
        if (mask & this.DEPTH_BUFFER_BIT) this.framebuffer.clearDepth(this.clearDepthValue)
    }

    enable(cap: number): void {
        if (cap in this.caps) this.caps[cap] = true
        else this.setError(this.INVALID_ENUM)
    }

    disable(cap: number): void {
        if (cap in this.caps) this.caps[cap] = false
        else this.setError(this.INVALID_ENUM)
    }

    cullFace(mode: number): void {
        if (mode === this.FRONT || mode === this.BACK || mode === this.FRONT_AND_BACK) this.cullFaceMode = mode
        else this.setError(this.INVALID_ENUM)
    }

    frontFace(dir: number): void {
        if (dir === this.CW || dir === this.CCW) this.frontFaceDir = dir
        else this.setError(this.INVALID_ENUM)
    }

    depthFunc(func: number): void {
        if (func in DEPTH_FUNCS) this.depthFuncValue = func
        else this.setError(this.INVALID_ENUM)
    }

    blendFunc(sfactor: number, dfactor: number): void {
        this.blendSrc = sfactor
        this.blendDst = dfactor
    }

    blendEquation(mode: number): void {
        if (mode !== this.FUNC_ADD) {
            // CPU 渲染器只实现 FUNC_ADD（最常见）
            this.setError(this.INVALID_ENUM)
        }
    }

    // ==================== 帧缓冲 ====================

    /** 当前绑定的帧缓冲（FBO 或默认） */
    get framebuffer(): CPUFramebuffer {
        return this.framebufferBinding ? this.framebufferBinding.framebuffer : this.defaultFramebuffer
    }

    /** 创建 FBO（可选指定尺寸，默认与默认帧缓冲一致） */
    createFramebuffer(width?: number, height?: number): CPUFrameBufferObject {
        const fbo: CPUFrameBufferObject = {
            framebuffer: new CPUFramebuffer(width ?? this.defaultFramebuffer.width, height ?? this.defaultFramebuffer.height),
        }
        this.fbos.add(fbo)
        return fbo
    }

    bindFramebuffer(target: number, framebuffer: CPUFrameBufferObject | null): void {
        if (target !== this.FRAMEBUFFER) {
            this.setError(this.INVALID_ENUM)
            return
        }
        this.framebufferBinding = framebuffer
    }

    checkFramebufferStatus(target: number): number {
        if (target !== this.FRAMEBUFFER) {
            this.setError(this.INVALID_ENUM)
            return 0
        }
        return this.FRAMEBUFFER_COMPLETE
    }

    deleteFramebuffer(framebuffer: CPUFrameBufferObject): void {
        this.fbos.delete(framebuffer)
        if (this.framebufferBinding === framebuffer) this.framebufferBinding = null
    }

    // ==================== 绘制 ====================

    /** 基于顶点顺序绘制（对应 gl.drawArrays），支持 strips/fans/loop 自动展开 */
    drawArrays(mode: number, first: number, count: number): void {
        const program = this.currentProgram
        if (!program?.executable) {
            this.setError(this.INVALID_OPERATION)
            return
        }
        const ids: number[] = []
        for (let i = 0; i < count; i++) ids.push(first + i)
        const expanded = this.expandPrimitive(mode, ids)
        if (!expanded) {
            this.setError(this.INVALID_ENUM)
            return
        }
        this.drawPrimitives(expanded.mode, expanded.ids)
    }

    /** 基于索引绘制（对应 gl.drawElements）；offset 为字节偏移 */
    drawElements(mode: number, count: number, type: number, offset: number): void {
        const ib = this.currentVAO.elementBuffer
        if (!ib?.data) {
            this.setError(this.INVALID_OPERATION)
            return
        }
        const bytePerIndex = type === this.UNSIGNED_INT ? 4 : type === this.UNSIGNED_SHORT ? 2 : -1
        if (bytePerIndex < 0) {
            this.setError(this.INVALID_ENUM)
            return
        }
        const start = offset / bytePerIndex
        const data = ib.data
        const ids: number[] = []
        for (let i = 0; i < count; i++) ids.push(data[start + i])
        const expanded = this.expandPrimitive(mode, ids)
        if (!expanded) {
            this.setError(this.INVALID_ENUM)
            return
        }
        this.drawPrimitives(expanded.mode, expanded.ids)
    }

    /**
     * 将 strip/fan/loop 展开为基本图元（LINES/TRIANGLES）。
     * 这是 WebGL 硬件自动完成的"图元组装"步骤，这里显式实现以便学习。
     */
    private expandPrimitive(mode: number, ids: number[]): { mode: DrawMode; ids: number[] } | null {
        switch (mode) {
            case this.POINTS:
                return { mode: 'points', ids }
            case this.LINES:
                return { mode: 'lines', ids }
            case this.TRIANGLES:
                return { mode: 'triangles', ids }
            case this.LINE_STRIP: {
                const out: number[] = []
                for (let i = 0; i < ids.length - 1; i++) out.push(ids[i], ids[i + 1])
                return { mode: 'lines', ids: out }
            }
            case this.LINE_LOOP: {
                const out: number[] = []
                for (let i = 0; i < ids.length - 1; i++) out.push(ids[i], ids[i + 1])
                if (ids.length > 2) out.push(ids[ids.length - 1], ids[0])
                return { mode: 'lines', ids: out }
            }
            case this.TRIANGLE_STRIP: {
                const out: number[] = []
                // 奇数三角形翻转绕序，保证正面一致
                for (let i = 0; i < ids.length - 2; i++) {
                    if (i % 2 === 0) out.push(ids[i], ids[i + 1], ids[i + 2])
                    else out.push(ids[i + 1], ids[i], ids[i + 2])
                }
                return { mode: 'triangles', ids: out }
            }
            case this.TRIANGLE_FAN: {
                const out: number[] = []
                for (let i = 1; i < ids.length - 1; i++) out.push(ids[0], ids[i], ids[i + 1])
                return { mode: 'triangles', ids: out }
            }
            default:
                return null
        }
    }

    /** 核心绘制：对图元引用的顶点去重运行顶点着色器，再交给 Rasterizer */
    private drawPrimitives(mode: DrawMode, ids: number[]): void {
        const program = this.currentProgram
        const executable = program?.executable
        if (!program || !executable) return

        // 1. 顶点着色（每个被引用的顶点 id 只执行一次）
        const idMap = new Map<number, number>()
        const clipVertices: ClipVertex[] = []
        for (const id of ids) {
            let ci = idMap.get(id)
            if (ci === undefined) {
                ci = clipVertices.length
                idMap.set(id, ci)
                clipVertices.push(this.runVertexShader(executable, program.uniforms, id))
            }
        }
        if (clipVertices.length === 0) return

        // 2. 压缩索引（指向去重后的顶点数组）
        const packed = clipVertices.length > 0xffff ? new Uint32Array(ids.length) : new Uint16Array(ids.length)
        for (let i = 0; i < ids.length; i++) packed[i] = idMap.get(ids[i])!

        // 3. 光栅化
        const rasterizer = new Rasterizer({
            viewport: this.viewportRaster,
            mode,
            cullFace: this.caps[this.CULL_FACE]
                ? this.cullFaceMode === this.FRONT_AND_BACK
                    ? 'both'
                    : this.cullFaceMode === this.FRONT
                        ? 'front'
                        : 'back'
                : 'none',
            frontFace: this.frontFaceDir === this.CW ? 'cw' : 'ccw',
            depthTest: this.caps[this.DEPTH_TEST],
            depthWrite: true,
            depthFunc: DEPTH_FUNCS[this.depthFuncValue] ?? 'less',
            blend: this.caps[this.BLEND],
            blendFactors: {
                src: blendFactorFn(this.blendSrc),
                dst: blendFactorFn(this.blendDst),
            },
            framebuffer: this.framebuffer,
        })
        rasterizer.draw(executable, program.uniforms, clipVertices, packed)
    }

    /** 按 VAO 的 attribute 布局读取顶点数据并运行顶点着色器 */
    private runVertexShader(executable: ShaderProgram, uniforms: Uniforms, vertexId: number): ClipVertex {
        const vao = this.currentVAO
        const names: string[] = []
        const values: (Float32Array | null)[] = []
        executable.attribs.forEach((decl, i) => {
            names.push(decl.name)
            const ptr = vao.attribs[i]
            const buf = ptr?.buffer?.data
            if (!ptr || !vao.enabled[i] || !buf) {
                values.push(null)
                return
            }
            const strideF = ptr.stride ? ptr.stride / 4 : decl.size
            const offsetF = ptr.offset / 4
            const start = offsetF + vertexId * strideF
            if (start + decl.size > buf.length) {
                values.push(null)
                return
            }
            values.push(Float32Array.from(buf.slice(start, start + decl.size)))
        })
        const view = new AttribView(names, values)
        const out = executable.vertex(view, uniforms)
        return { position: out.position, varyings: out.varyings }
    }

    // ==================== 像素回读 ====================

    /**
     * 读取像素（对应 gl.readPixels）。
     * 仅支持 RGBA + UNSIGNED_BYTE；y 为左下原点（WebGL 约定，行序从下往上）。
     */
    readPixels(x: number, y: number, width: number, height: number, format: number, type: number, pixels: Uint8Array | Uint8ClampedArray): void {
        if (format !== this.RGBA || type !== this.UNSIGNED_BYTE) {
            this.setError(this.INVALID_ENUM)
            return
        }
        const fb = this.framebuffer
        for (let row = 0; row < height; row++) {
            const srcY = fb.height - y - 1 - row
            for (let col = 0; col < width; col++) {
                const [r, g, b, a] = fb.readColor(x + col, srcY)
                const o = (row * width + col) * 4
                pixels[o] = r
                pixels[o + 1] = g
                pixels[o + 2] = b
                pixels[o + 3] = a
            }
        }
    }

    /** 释放所有追踪的资源并重置状态 */
    destroy(): void {
        this.shaders.clear()
        this.programs.clear()
        this.buffers.clear()
        this.vaos.clear()
        this.fbos.clear()
        this.currentProgram = null
        this.currentVAO = this.defaultVAO
        this.arrayBufferBinding = null
        this.framebufferBinding = null
    }
}
