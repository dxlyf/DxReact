/**
 * WebGPU CPU 模拟 —— 类型与常量。
 *
 * WebGPU 与 WebGL 的几个本质差异（本目录的核心教学点）：
 * 1. 渲染管线（GPURenderPipeline）是"不可变状态对象"：顶点布局、着色器、图元、
 *    深度/模板、混合全部在 createRenderPipeline 时固化，绘制时只 setPipeline。
 * 2. 命令编码模式：GPUCommandEncoder 记录 → GPURenderPassEncoder 内 draw →
 *    finish() 得到命令缓冲 → queue.submit 一次性执行。
 * 3. 绑定组（BindGroup）：uniform/纹理/采样器按 binding 序号绑定，不直接改状态。
 * 4. 坐标约定：NDC x,y∈[-1,1]（y 向上）、z∈[0,1]；viewport 原点在左上角。
 * 5. 顶点属性用 format + shaderLocation 描述（不再有 vertexAttribPointer 全局状态）。
 */
import { Vec3, Vec4 } from './math'

// ==================== 资源 ====================

/** 着色器入口输入：顶点属性按 shaderLocation 取值 */
export interface WGSLVertexInput {
    /** 按 shaderLocation 取顶点属性值（未启用返回 null） */
    location(index: number): Float32Array | null
    /** 顶点索引（draw 的第几个顶点，含 firstVertex） */
    vertexIndex: number
    /** 实例索引（含 firstInstance） */
    instanceIndex: number
    /** 绑定组资源：binding 序号 → uniform 数据 / 纹理 / 采样器 */
    bindings: Record<number, unknown>
}

/** 顶点着色器输出（对应 WGSL @vertex 返回的 @builtin(position) + @location(n)） */
export interface WGSLVertexOutput {
    /** 裁剪空间位置。WebGPU 约定：x,y∈[-w,w]，z∈[0,w] */
    position: Vec4
    /** 插值 varying，按位置索引（模拟 @location(n) out） */
    varyings: number[]
}

/** 片元着色器输入 */
export interface WGSLFragmentInput {
    /** 片元坐标（像素，原点左上，0.5 对齐像素中心），z 为 [0,1] 深度 */
    fragCoord: Vec3
    /** 透视校正插值后的 varying */
    varyings: Float32Array
    /** 绑定组资源 */
    bindings: Record<number, unknown>
}

export type WGSLVertexFn = (input: WGSLVertexInput) => WGSLVertexOutput
export type WGSLFragmentFn = (input: WGSLFragmentInput) => Vec4

/**
 * WGSL 着色器"源码"。
 * source 为展示用 WGSL 文本（不执行）；vertex/fragment 为 JS 入口函数（CPU 实际执行）。
 * 这样既贴近 createShaderModule({ code }) 的 API 形态，又能在 CPU 上运行。
 */
export interface WGSLCode {
    /** WGSL 源码（教学展示，注释性质） */
    source: string
    vertex?: WGSLVertexFn
    fragment?: WGSLFragmentFn
}

/** 着色器模块（模拟 GPUShaderModule） */
export interface GPUShaderModule {
    readonly code: WGSLCode
}

// ==================== 顶点缓冲布局 ====================

/** 顶点格式（只支持常见子集），解析出分量数与字节数 */
export type GPUVertexFormat =
    | 'float32'
    | 'float32x2'
    | 'float32x3'
    | 'float32x4'
    | 'unorm8x2'
    | 'unorm8x4'
    | 'sint32'
    | 'sint32x2'
    | 'sint32x3'
    | 'sint32x4'
    | 'uint32'
    | 'uint32x2'
    | 'uint32x3'
    | 'uint32x4'
    | 'uint16x2'
    | 'uint16x4'

export type GPUVertexStepMode = 'vertex' | 'instance'

/** 顶点属性描述（对应 WGSL @location(n) 与 GPUVertexBufferLayout.attributes） */
export interface GPUVertexAttribute {
    shaderLocation: number
    offset: number
    format: GPUVertexFormat
}

/** 顶点缓冲布局（对应 GPURenderPipelineDescriptor.vertex.buffers） */
export interface GPUVertexBufferLayout {
    arrayStride: number
    stepMode?: GPUVertexStepMode
    attributes: GPUVertexAttribute[]
}

interface FormatInfo {
    components: number
    bytes: number
    kind: 'float' | 'unorm' | 'sint' | 'uint'
}

/** 顶点格式表：格式名 → 分量数/字节数/类型 */
export const VERTEX_FORMATS: Record<string, FormatInfo> = {
    float32: { components: 1, bytes: 4, kind: 'float' },
    float32x2: { components: 2, bytes: 8, kind: 'float' },
    float32x3: { components: 3, bytes: 12, kind: 'float' },
    float32x4: { components: 4, bytes: 16, kind: 'float' },
    unorm8x2: { components: 2, bytes: 2, kind: 'unorm' },
    unorm8x4: { components: 4, bytes: 4, kind: 'unorm' },
    sint32: { components: 1, bytes: 4, kind: 'sint' },
    sint32x2: { components: 2, bytes: 8, kind: 'sint' },
    sint32x3: { components: 3, bytes: 12, kind: 'sint' },
    sint32x4: { components: 4, bytes: 16, kind: 'sint' },
    uint32: { components: 1, bytes: 4, kind: 'uint' },
    uint32x2: { components: 2, bytes: 8, kind: 'uint' },
    uint32x3: { components: 3, bytes: 12, kind: 'uint' },
    uint32x4: { components: 4, bytes: 16, kind: 'uint' },
    uint16x2: { components: 2, bytes: 4, kind: 'uint' },
    uint16x4: { components: 4, bytes: 8, kind: 'uint' },
}

/** 从缓冲区按格式读取一个顶点属性值 */
export function readVertexAttribute(view: DataView, byteOffset: number, format: GPUVertexFormat): Float32Array {
    const info = VERTEX_FORMATS[format]
    if (!info) throw new Error(`Unknown vertex format: ${format}`)
    const out = new Float32Array(info.components)
    for (let i = 0; i < info.components; i++) {
        const off = byteOffset + i * (info.bytes / info.components)
        switch (info.kind) {
            case 'float':
                out[i] = view.getFloat32(off, true)
                break
            case 'unorm':
                out[i] = view.getUint8(off) / 255
                break
            case 'sint':
                out[i] = view.getInt32(off, true)
                break
            case 'uint': {
                if (info.bytes / info.components === 4) out[i] = view.getUint32(off, true)
                else out[i] = view.getUint16(off, true)
                break
            }
        }
    }
    return out
}

// ==================== 图元 ====================

export type GPUPrimitiveTopology = 'point-list' | 'line-list' | 'line-strip' | 'triangle-list' | 'triangle-strip'
export type GPUCullMode = 'none' | 'front' | 'back'
export type GPUFrontFace = 'ccw' | 'cw'

export interface GPUPrimitiveState {
    topology?: GPUPrimitiveTopology
    frontFace?: GPUFrontFace
    cullMode?: GPUCullMode
    /** 三角形带/strip 中索引所代表的格式（连续三角形自动生成退化顶点） */
    stripIndexFormat?: 'uint16' | 'uint32'
}

// ==================== 深度 / 模板 ====================

export type GPUCompareFunction = 'never' | 'less' | 'equal' | 'less-equal' | 'greater' | 'not-equal' | 'greater-equal' | 'always'
export type GPUStencilOperation = 'keep' | 'zero' | 'replace' | 'invert' | 'increment-clamp' | 'decrement-clamp' | 'increment-wrap' | 'decrement-wrap'
export type GPUDepthStencilFormat = 'depth24plus' | 'depth24plus-stencil8' | 'depth32float'

export interface GPUStencilFaceState {
    compare?: GPUCompareFunction
    failOp?: GPUStencilOperation
    depthFailOp?: GPUStencilOperation
    passOp?: GPUStencilOperation
}

export interface GPUDepthStencilState {
    format: GPUDepthStencilFormat
    depthWriteEnabled?: boolean
    depthCompare?: GPUCompareFunction
    stencilFront?: GPUStencilFaceState
    stencilBack?: GPUStencilFaceState
    stencilReadMask?: number
    stencilWriteMask?: number
}

// ==================== 混合 ====================

export type GPUBlendFactor =
    | 'zero'
    | 'one'
    | 'src'
    | 'one-minus-src'
    | 'src-alpha'
    | 'one-minus-src-alpha'
    | 'dst'
    | 'one-minus-dst'
    | 'dst-alpha'
    | 'one-minus-dst-alpha'
    | 'src-alpha-saturated'
    | 'constant'
    | 'one-minus-constant'
export type GPUBlendOperation = 'add' | 'subtract' | 'reverse-subtract' | 'min' | 'max'

export interface GPUBlendComponent {
    srcFactor?: GPUBlendFactor
    dstFactor?: GPUBlendFactor
    operation?: GPUBlendOperation
}

export interface GPUBlendState {
    color: GPUBlendComponent
    alpha: GPUBlendComponent
}

export interface GPUColorTargetState {
    format: string
    blend?: GPUBlendState
    writeMask?: number
}

// ==================== 渲染管线 ====================

export interface GPUVertexState {
    module: GPUShaderModule
    entryPoint?: string
    buffers?: GPUVertexBufferLayout[]
}

export interface GPUFragmentState {
    module: GPUShaderModule
    entryPoint?: string
    targets: GPUColorTargetState[]
}

export interface GPURenderPipelineDescriptor {
    layout?: unknown
    vertex: GPUVertexState
    fragment?: GPUFragmentState
    primitive?: GPUPrimitiveState
    depthStencil?: GPUDepthStencilState
    multisample?: { count?: number }
}

/** 编译后的内部管线：把所有状态展开成可执行结构（对应 GPU 驱动编译 pipeline） */
export interface InternalPipeline {
    vertexFn?: WGSLVertexFn
    fragmentFn?: WGSLFragmentFn
    buffers: GPUVertexBufferLayout[]
    topology: GPUPrimitiveTopology
    frontFace: GPUFrontFace
    cullMode: GPUCullMode
    depth?: {
        write: boolean
        compare: GPUCompareFunction
        format: GPUDepthStencilFormat
    }
    stencil?: {
        front: GPUStencilFaceState
        back: GPUStencilFaceState
        readMask: number
        writeMask: number
    }
    blend?: GPUBlendState[]
    fragmentTargets: GPUColorTargetState[]
    hasDepthAttachment: boolean
    hasStencilAttachment: boolean
}

// ==================== 比较/操作 求值 ====================

export function comparePass(func: GPUCompareFunction, ref: number, value: number): boolean {
    switch (func) {
        case 'never': return false
        case 'less': return ref < value
        case 'equal': return ref === value
        case 'less-equal': return ref <= value
        case 'greater': return ref > value
        case 'not-equal': return ref !== value
        case 'greater-equal': return ref >= value
        case 'always': return true
    }
}

export function stencilOp(op: GPUStencilOperation, current: number, ref: number, writeMask: number): number {
    let value: number
    switch (op) {
        case 'keep': value = current; break
        case 'zero': value = 0; break
        case 'replace': value = ref & 0xff; break
        case 'invert': value = ~current & 0xff; break
        case 'increment-clamp': value = Math.min(255, current + 1); break
        case 'decrement-clamp': value = Math.max(0, current - 1); break
        case 'increment-wrap': value = (current + 1) & 0xff; break
        case 'decrement-wrap': value = (current - 1) & 0xff; break
    }
    return (value & writeMask) | (current & ~writeMask)
}
