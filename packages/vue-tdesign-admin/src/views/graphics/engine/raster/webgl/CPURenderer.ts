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
import type { BlendFactorFn, DepthFunc, DrawMode, FragmentStageSource, ShaderProgram, StencilOp, Uniforms, VertexStageSource } from './types'

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
    /** transformFeedbackVaryings 设置的捕获列表（link 前设置，link 时编译） */
    tfVaryings: string[]
    /** SEPARATE_ATTRIBS | INTERLEAVED_ATTRIBS */
    tfBufferMode: number | null
    /** link 时编译的每个捕获 varying 在 varyings 输出数组中的起点（-1 = 无效） */
    tfIndices: number[]
    /** link 时编译的每个捕获 varying 的分量数（与 tfIndices 对齐） */
    tfSizes: number[]
}

/** CPU 查询对象（模拟 gl.createQuery 的结果，WebGL2） */
export interface CPUQuery {
    /** beginQuery 设置的查询目标（null = 未激活/已结束） */
    target: number | null
    /** 是否处于 beginQuery..endQuery 之间 */
    active: boolean
    /** 查询结果（TF 写入图元数 / 遮挡查询 0|1） */
    result: number
    /** 查询是否已完成（endQuery 后为 true） */
    available: boolean
}

/** CPU 变换反馈对象（模拟 gl.createTransformFeedback 的结果，WebGL2） */
export interface CPUTransformFeedback {
    /** bindBufferBase(TRANSFORM_FEEDBACK_BUFFER, index) 绑定的缓冲（index → buffer） */
    boundBuffers: (CPUBuffer | null)[]
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
    /** 实例化步进（对应 gl.vertexAttribDivisor，WebGL2） */
    divisor: number
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

/** 模板操作常量 -> 操作名（对应 Rasterizer 的 StencilOp） */
const STENCIL_OPS: Record<number, StencilOp> = {
    0x0000: 'zero', // ZERO
    0x1e00: 'keep', // KEEP
    0x1e01: 'replace', // REPLACE
    0x1e02: 'incr', // INCR
    0x1e03: 'decr', // DECR
    0x150a: 'invert', // INVERT
    0x8507: 'incrWrap', // INCR_WRAP
    0x8508: 'decrWrap', // DECR_WRAP
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
    readonly STENCIL_TEST = 0x0b90
    readonly SCISSOR_TEST = 0x0c11

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
    readonly STENCIL_BUFFER_BIT = 0x00000400

    // 模板操作（ZERO 复用混合因子中的 0x0000）
    readonly KEEP = 0x1e00
    readonly REPLACE = 0x1e01
    readonly INCR = 0x1e02
    readonly DECR = 0x1e03
    readonly INVERT = 0x150a
    readonly INCR_WRAP = 0x8507
    readonly DECR_WRAP = 0x8508

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

    // WebGL2：查询对象
    readonly TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN = 0x8b88
    readonly ANY_SAMPLES_PASSED = 0x8c2f
    readonly ANY_SAMPLES_PASSED_CONSERVATIVE = 0x8c30
    readonly CURRENT_QUERY = 0x8865
    readonly QUERY_RESULT = 0x8866
    readonly QUERY_RESULT_AVAILABLE = 0x8867

    // WebGL2：变换反馈（transform feedback）
    readonly TRANSFORM_FEEDBACK = 0x8e22
    readonly TRANSFORM_FEEDBACK_BUFFER = 0x8c8e
    readonly TRANSFORM_FEEDBACK_ACTIVE = 0x8e24
    readonly SEPARATE_ATTRIBS = 0x8c8d
    readonly INTERLEAVED_ATTRIBS = 0x8c8c

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
    private clearStencilValue = 0

    private caps: Record<number, boolean> = {
        [this.DEPTH_TEST]: false,
        [this.BLEND]: false,
        [this.CULL_FACE]: false,
        [this.STENCIL_TEST]: false,
        [this.SCISSOR_TEST]: false,
    }
    /** WebGL 语义裁剪矩形（左下原点） */
    private scissorGL = { x: 0, y: 0, width: 0, height: 0 }
    private cullFaceMode = this.BACK
    private frontFaceDir = this.CCW
    private depthFuncValue = this.LESS
    private blendSrc = this.ONE
    private blendDst = this.ZERO
    private stencilFuncValue = this.ALWAYS
    private stencilRef = 0
    private stencilReadMask = 0xff
    private stencilWriteMask = 0xff
    private stencilOpFail: StencilOp = 'keep'
    private stencilOpZFail: StencilOp = 'keep'
    private stencilOpZPass: StencilOp = 'keep'

    private error = 0

    // 资源追踪（便于 destroy() 清理）
    private shaders = new Set<CPUShader>()
    private programs = new Set<CPUProgram>()
    private buffers = new Set<CPUBuffer>()
    private vaos = new Set<CPUVertexArray>()
    private fbos = new Set<CPUFrameBufferObject>()
    private queries = new Set<CPUQuery>()
    private transformFeedbacks = new Set<CPUTransformFeedback>()

    // WebGL2：查询与变换反馈状态
    private currentTransformFeedback: CPUTransformFeedback | null = null
    private transformFeedbackActive = false
    /** target → 处于 beginQuery..endQuery 之间的查询对象 */
    private activeQueries = new Map<number, CPUQuery>()
    /** TF 写入时每个缓冲的当前游标（float 元素单位，beginTransformFeedback 时重置为 0） */
    private tfWriteOffsets = new Map<CPUBuffer, number>()

    constructor(options: CPURendererOptions = {}) {
        const width = options.width ?? 300
        const height = options.height ?? 150
        this.defaultFramebuffer = new CPUFramebuffer(width, height)
        this.defaultVAO = this.makeVAO()
        this.currentVAO = this.defaultVAO
        this.viewport(0, 0, width, height)
        this.scissorGL = { x: 0, y: 0, width, height } // 初始与绘制缓冲一致（同 WebGL）
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
            tfVaryings: [],
            tfBufferMode: null,
            tfIndices: [],
            tfSizes: [],
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
            program.tfIndices = []
            program.tfSizes = []
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
        // 编译 transform feedback 捕获映射：tfVaryings 名 → varyings 输出数组中的 [起点, 分量数)
        // 顶点着色器声明 varyings 时按名查找（起点=前面声明的分量累计）；未声明时按顺序对应（每捕获 1 分量）
        const starts = new Map<string, [number, number]>()
        if (v.varyings) {
            let acc = 0
            for (const item of v.varyings) {
                const name = typeof item === 'string' ? item : item.name
                const size = typeof item === 'string' ? 1 : item.size
                starts.set(name, [acc, size])
                acc += size
            }
            program.tfIndices = program.tfVaryings.map((name) => starts.get(name)?.[0] ?? -1)
            program.tfSizes = program.tfVaryings.map((name) => starts.get(name)?.[1] ?? 0)
        } else {
            program.tfIndices = program.tfVaryings.map((_, i) => i)
            program.tfSizes = program.tfVaryings.map(() => 1)
        }
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

    // ==================== 查询对象（WebGL2）====================

    /** 创建查询对象（对应 gl.createQuery）。结果在 endQuery 后通过 getQueryParameter 读取 */
    createQuery(): CPUQuery {
        const query: CPUQuery = { target: null, active: false, result: 0, available: false }
        this.queries.add(query)
        return query
    }

    deleteQuery(query: CPUQuery): void {
        if (query.active) this.endQuery(query.target!)
        this.queries.delete(query)
    }

    /**
     * 开始查询（对应 gl.beginQuery）。
     * 同一 target 不能重复 begin；查询对象不能被重复使用。
     */
    beginQuery(target: number, query: CPUQuery): void {
        const validTarget =
            target === this.TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN ||
            target === this.ANY_SAMPLES_PASSED ||
            target === this.ANY_SAMPLES_PASSED_CONSERVATIVE
        if (!validTarget) {
            this.setError(this.INVALID_ENUM)
            return
        }
        if (this.activeQueries.has(target)) {
            this.setError(this.INVALID_OPERATION)
            return
        }
        if (query.target !== null && query.target !== target) {
            this.setError(this.INVALID_OPERATION)
            return
        }
        query.target = target
        query.active = true
        query.result = 0
        query.available = false
        this.activeQueries.set(target, query)
    }

    /** 结束查询（对应 gl.endQuery）。此后结果可通过 getQueryParameter 读取 */
    endQuery(target: number): void {
        const query = this.activeQueries.get(target)
        if (!query) {
            this.setError(this.INVALID_OPERATION)
            return
        }
        query.active = false
        query.available = true
        this.activeQueries.delete(target)
    }

    /**
     * 读取查询结果（对应 gl.getQueryParameter）。
     * - QUERY_RESULT：结果值（TF 写入图元数 / 遮挡查询 0|1）
     * - QUERY_RESULT_AVAILABLE：查询是否已完成
     * - CURRENT_QUERY：该查询是否处于激活状态（激活返回目标常量，否则返回 0）
     */
    getQueryParameter(query: CPUQuery, pname: number): number | boolean {
        if (pname === this.QUERY_RESULT) return query.result
        if (pname === this.QUERY_RESULT_AVAILABLE) return query.available
        if (pname === this.CURRENT_QUERY) return query.active ? query.target! : 0
        this.setError(this.INVALID_ENUM)
        return 0
    }

    // ==================== 变换反馈（WebGL2）====================

    /** 创建变换反馈对象（对应 gl.createTransformFeedback） */
    createTransformFeedback(): CPUTransformFeedback {
        const tf: CPUTransformFeedback = { boundBuffers: [] }
        this.transformFeedbacks.add(tf)
        return tf
    }

    deleteTransformFeedback(tf: CPUTransformFeedback): void {
        if (this.currentTransformFeedback === tf) this.currentTransformFeedback = null
        this.transformFeedbacks.delete(tf)
    }

    /** 绑定变换反馈对象（对应 gl.bindTransformFeedback；target 必须为 TRANSFORM_FEEDBACK） */
    bindTransformFeedback(target: number, tf: CPUTransformFeedback | null): void {
        if (target !== this.TRANSFORM_FEEDBACK) {
            this.setError(this.INVALID_ENUM)
            return
        }
        if (this.transformFeedbackActive) {
            this.setError(this.INVALID_OPERATION)
            return
        }
        this.currentTransformFeedback = tf
    }

    /**
     * 把缓冲绑定到变换反馈的某个索引（对应 gl.bindBufferBase，仅支持 TRANSFORM_FEEDBACK_BUFFER）。
     * INTERLEAVED_ATTRIBS 用索引 0；SEPARATE_ATTRIBS 每个 varying 对应一个索引。
     */
    bindBufferBase(target: number, index: number, buffer: CPUBuffer | null): void {
        if (target !== this.TRANSFORM_FEEDBACK_BUFFER) {
            this.setError(this.INVALID_ENUM)
            return
        }
        if (index < 0) {
            this.setError(this.INVALID_VALUE)
            return
        }
        if (!this.currentTransformFeedback) {
            this.setError(this.INVALID_OPERATION)
            return
        }
        this.currentTransformFeedback.boundBuffers[index] = buffer
    }

    /**
     * 配置变换反馈捕获的 varying（对应 gl.transformFeedbackVaryings）。
     * 必须在 linkProgram 之前调用；link 时把名字映射到顶点着色器的 varyings 输出索引。
     */
    transformFeedbackVaryings(program: CPUProgram, varyings: string[], bufferMode: number): void {
        if (program.linked) {
            this.setError(this.INVALID_OPERATION)
            return
        }
        if (bufferMode !== this.SEPARATE_ATTRIBS && bufferMode !== this.INTERLEAVED_ATTRIBS) {
            this.setError(this.INVALID_ENUM)
            return
        }
        program.tfVaryings = varyings.slice()
        program.tfBufferMode = bufferMode
    }

    /**
     * 开始变换反馈捕获（对应 gl.beginTransformFeedback）。
     * 要求：程序已链接且配置了捕获；mode 与绘制图元类型匹配。
     * begin 时把绑定的 TF 缓冲写游标重置到 0（覆盖写，同 bindBufferBase 语义）。
     */
    beginTransformFeedback(mode: number): void {
        if (mode !== this.POINTS && mode !== this.LINES && mode !== this.TRIANGLES) {
            this.setError(this.INVALID_ENUM)
            return
        }
        if (this.transformFeedbackActive) {
            this.setError(this.INVALID_OPERATION)
            return
        }
        const program = this.currentProgram
        if (!program?.linked || program.tfVaryings.length === 0 || !program.tfBufferMode) {
            this.setError(this.INVALID_OPERATION)
            return
        }
        this.transformFeedbackActive = true
        // 重置所有绑定缓冲的写游标（覆盖写）
        for (const buf of this.currentTransformFeedback?.boundBuffers ?? []) {
            if (buf) this.tfWriteOffsets.set(buf, 0)
        }
    }

    /** 结束变换反馈捕获（对应 gl.endTransformFeedback） */
    endTransformFeedback(): void {
        if (!this.transformFeedbackActive) {
            this.setError(this.INVALID_OPERATION)
            return
        }
        this.transformFeedbackActive = false
    }

    /**
     * 把顶点着色器的 varyings 输出写入变换反馈缓冲。
     * - INTERLEAVED_ATTRIBS：全部写 boundBuffers[0]，逐顶点交错排列
     * - SEPARATE_ATTRIBS：每个捕获 varying 写独立缓冲 boundBuffers[i]
     * 按图元引用的原始顶点顺序写入（重复引用的顶点重复写入，同真实 GPU）。
     *
     * 每个捕获 varying 视为 varyings 数组中的一个连续区间：
     * 起点 = 该 varying 的索引（tfIndices[i]），终点 = 下一个捕获索引（或数组末尾）。
     * 即 vPos(vec2) 占 2 个分量、vColor(vec3) 占 3 个分量。
     */
    private captureTransformFeedback(ids: number[], idMap: Map<number, number>, clipVertices: ClipVertex[]): void {
        if (!this.transformFeedbackActive) return
        const program = this.currentProgram
        const tf = this.currentTransformFeedback
        if (!program || !tf || program.tfIndices.some((i) => i < 0) || clipVertices.length === 0) return

        // 每个捕获 varying 的 [start, end) 区间（起点 + 分量数）
        const ranges = program.tfIndices.map((start, i) => [start, start + program.tfSizes[i]] as const)

        if (program.tfBufferMode === this.INTERLEAVED_ATTRIBS) {
            const buf = tf.boundBuffers[0]
            if (!buf) return
            for (const id of ids) {
                const varyings = clipVertices[idMap.get(id)!].varyings
                const values: number[] = []
                for (const [s, e] of ranges) for (let k = s; k < e; k++) values.push(varyings[k])
                this.writeTransformFeedback(buf, values)
            }
        } else {
            for (const id of ids) {
                const varyings = clipVertices[idMap.get(id)!].varyings
                ranges.forEach(([s, e], i) => {
                    const buf = tf.boundBuffers[i]
                    if (!buf) return
                    const values: number[] = []
                    for (let k = s; k < e; k++) values.push(varyings[k])
                    this.writeTransformFeedback(buf, values)
                })
            }
        }
    }

    /** 向 TF 缓冲写入一组 float（从当前游标开始，空间不足时自动扩容） */
    private writeTransformFeedback(buffer: CPUBuffer, values: number[]): void {
        let data = buffer.data
        if (!data || !(data instanceof Float32Array)) {
            data = new Float32Array(Math.max(16, values.length * 2))
            buffer.data = data
        }
        let offset = this.tfWriteOffsets.get(buffer) ?? 0
        if (offset + values.length > data.length) {
            // 扩容：不足时加倍到需要的大小
            const next = new Float32Array(Math.max(data.length * 2, offset + values.length))
            next.set(data)
            data = next
            buffer.data = next
        }
        for (let i = 0; i < values.length; i++) data[offset + i] = values[i]
        this.tfWriteOffsets.set(buffer, offset + values.length)
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
            divisor: 0,
        }
    }

    /**
     * 设置 attribute 的实例化步进（对应 gl.vertexAttribDivisor，WebGL2）。
     * divisor=0 时 attribute 每实例不变；divisor=1 时每实例前进一个元素。
     */
    vertexAttribDivisor(index: number, divisor: number): void {
        if (divisor < 0) {
            this.setError(this.INVALID_VALUE)
            return
        }

        const ptr = this.currentVAO.attribs[index]
        if (!ptr) {
            this.setError(this.INVALID_OPERATION)
            return
        }
        ptr.divisor = divisor
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

    /**
     * 设置裁剪矩形（对应 gl.scissor，WebGL 语义：左下原点）。
     * 启用 SCISSOR_TEST 后，绘制与 clear 都只影响该区域内像素。
     */
    scissor(x: number, y: number, width: number, height: number): void {
        if (width < 0 || height < 0) {
            this.setError(this.INVALID_VALUE)
            return
        }
        this.scissorGL = { x, y, width, height }
    }

    /** 裁剪矩形转换为内部帧缓冲坐标（左上原点） */
    private getScissorRaster(): { x: number; y: number; width: number; height: number } {
        const fb = this.framebuffer
        const { x, y, width, height } = this.scissorGL
        return { x, y: fb.height - (y + height), width, height }
    }

    clearColor(r: number, g: number, b: number, a = 1): void {
        this.clearColorValue = [r, g, b, a]
    }

    clearDepth(depth: number): void {
        this.clearDepthValue = depth
    }

    clearStencil(value: number): void {
        this.clearStencilValue = value & 0xff
    }

    /** 清除颜色/深度/模板缓冲（mask 为 COLOR_BUFFER_BIT | DEPTH_BUFFER_BIT | STENCIL_BUFFER_BIT） */
    clear(mask: number): void {
        const fb = this.framebuffer
        const scissored = this.caps[this.SCISSOR_TEST]
        const region = scissored ? this.getScissorRaster() : { x: 0, y: 0, width: fb.width, height: fb.height }
        const { x, y, width, height } = region

        if (mask & this.COLOR_BUFFER_BIT) {
            const [r, g, b, a] = this.clearColorValue
            if (scissored) {
                for (let py = y; py < y + height; py++)
                    for (let px = x; px < x + width; px++)
                        fb.writeColor(px, py, Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), Math.round(a * 255))
            } else {
                fb.clearColor(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), Math.round(a * 255))
            }
        }
        if (mask & this.DEPTH_BUFFER_BIT) {
            if (scissored) {
                for (let py = y; py < y + height; py++)
                    for (let px = x; px < x + width; px++) fb.writeDepth(px, py, this.clearDepthValue)
            } else {
                fb.clearDepth(this.clearDepthValue)
            }
        }
        if (mask & this.STENCIL_BUFFER_BIT) {
            if (scissored) {
                for (let py = y; py < y + height; py++)
                    for (let px = x; px < x + width; px++) fb.writeStencil(px, py, this.clearStencilValue)
            } else {
                fb.clearStencil(this.clearStencilValue)
            }
        }
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

    /** 模板测试函数（对应 gl.stencilFunc(func, ref, mask)） */
    stencilFunc(func: number, ref: number, mask: number): void {
        if (!(func in DEPTH_FUNCS)) {
            this.setError(this.INVALID_ENUM)
            return
        }
        this.stencilFuncValue = func
        this.stencilRef = ref & 0xff
        this.stencilReadMask = mask & 0xff
    }

    /** 模板写掩码（对应 gl.stencilMask(mask)） */
    stencilMask(mask: number): void {
        this.stencilWriteMask = mask & 0xff
    }

    /** 模板操作（对应 gl.stencilOp(fail, zfail, zpass)） */
    stencilOp(fail: number, zfail: number, zpass: number): void {
        if (!(fail in STENCIL_OPS) || !(zfail in STENCIL_OPS) || !(zpass in STENCIL_OPS)) {
            this.setError(this.INVALID_ENUM)
            return
        }
        this.stencilOpFail = STENCIL_OPS[fail]
        this.stencilOpZFail = STENCIL_OPS[zfail]
        this.stencilOpZPass = STENCIL_OPS[zpass]
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

    /** 基于顶点顺序绘制多个实例（对应 gl.drawArraysInstanced，WebGL2） */
    drawArraysInstanced(mode: number, first: number, count: number, instanceCount: number): void {
        if (instanceCount < 0) {
            this.setError(this.INVALID_VALUE)
            return
        }
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
        this.drawPrimitives(expanded.mode, expanded.ids, instanceCount)
    }

    /** 基于索引绘制多个实例（对应 gl.drawElementsInstanced，WebGL2）；offset 为字节偏移 */
    drawElementsInstanced(mode: number, count: number, type: number, offset: number, instanceCount: number): void {
        if (instanceCount < 0) {
            this.setError(this.INVALID_VALUE)
            return
        }
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
        this.drawPrimitives(expanded.mode, expanded.ids, instanceCount)
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
    private drawPrimitives(mode: DrawMode, ids: number[], instanceCount = 1): void {
        const program = this.currentProgram
        const executable = program?.executable
        if (!program || !executable) return

        // 实例化：divisor>0 的 attribute 每实例取值不同，顶点着色器需逐实例重跑
        for (let inst = 0; inst < instanceCount; inst++) {
            // 1. 顶点着色（每个被引用的顶点 id 只执行一次）
            const idMap = new Map<number, number>()
            const clipVertices: ClipVertex[] = []
            for (const id of ids) {
                let ci = idMap.get(id)
                if (ci === undefined) {
                    ci = clipVertices.length
                    idMap.set(id, ci)
                    clipVertices.push(this.runVertexShader(executable, program.uniforms, id, inst))
                }
            }
            if (clipVertices.length === 0) return

            // 2. 压缩索引（指向去重后的顶点数组）
            const packed = clipVertices.length > 0xffff ? new Uint32Array(ids.length) : new Uint16Array(ids.length)
            for (let i = 0; i < ids.length; i++) packed[i] = idMap.get(ids[i])!

            // 2.5 变换反馈捕获：把顶点着色器的 varyings 输出写入绑定的 TF 缓冲（按原始引用顺序）
            this.captureTransformFeedback(ids, idMap, clipVertices)

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
                stencilTest: this.caps[this.STENCIL_TEST],
                stencilFunc: DEPTH_FUNCS[this.stencilFuncValue] ?? 'always',
                stencilRef: this.stencilRef,
                stencilReadMask: this.stencilReadMask,
                stencilWriteMask: this.stencilWriteMask,
                stencilOpFail: this.stencilOpFail,
                stencilOpZFail: this.stencilOpZFail,
                stencilOpZPass: this.stencilOpZPass,
                scissorTest: this.caps[this.SCISSOR_TEST],
                scissorRect: this.getScissorRaster(),
                blend: this.caps[this.BLEND],
                blendFactors: {
                    src: blendFactorFn(this.blendSrc),
                    dst: blendFactorFn(this.blendDst),
                },
                framebuffer: this.framebuffer,
            })
            const written = rasterizer.draw(executable, program.uniforms, clipVertices, packed)

            // 4. 更新激活的查询对象（WebGL2）
            this.updateQueries(written, ids.length / this.perPrimCount(mode))
        }
    }

    /** 图元类型的每图元顶点数（points=1, lines=2, triangles=3） */
    private perPrimCount(mode: DrawMode): number {
        return mode === 'triangles' ? 3 : mode === 'lines' ? 2 : 1
    }

    /**
     * 按本次 draw 的结果更新激活的查询：
     * - TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN：累加写入的图元数
     * - ANY_SAMPLES_PASSED(_CONSERVATIVE)：有任何像素通过深度测试则置 1
     */
    private updateQueries(pixelsWritten: number, primCount: number): void {
        const tfQuery = this.activeQueries.get(this.TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN)
        if (tfQuery) tfQuery.result += Math.floor(primCount)
        const anyQuery =
            this.activeQueries.get(this.ANY_SAMPLES_PASSED) ??
            this.activeQueries.get(this.ANY_SAMPLES_PASSED_CONSERVATIVE)
        if (anyQuery && pixelsWritten > 0) anyQuery.result = 1
    }

    /** 按 VAO 的 attribute 布局读取顶点数据并运行顶点着色器 */
    private runVertexShader(executable: ShaderProgram, uniforms: Uniforms, vertexId: number, instanceId = 0): ClipVertex {
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
            // divisor>0：所有顶点共享同一实例值（每 divisor 个实例前进一个元素，WebGL 语义）
            // divisor=0：attribute 随顶点前进（每顶点 strideF 个元素）
            const step = ptr.divisor > 0 ? Math.floor(instanceId / ptr.divisor) : vertexId
            const start = offsetF + step * strideF
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
        this.queries.clear()
        this.transformFeedbacks.clear()
        this.activeQueries.clear()
        this.tfWriteOffsets.clear()
        this.currentProgram = null
        this.currentVAO = this.defaultVAO
        this.currentTransformFeedback = null
        this.transformFeedbackActive = false
        this.arrayBufferBinding = null
        this.framebufferBinding = null
    }
}
