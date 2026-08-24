/**
 * WebGPU CPU 模拟 —— GPU 对象模型与命令执行。
 *
 * 忠实对齐真实 WebGPU API 形态（可在浏览器用真 WebGPU 平移）：
 *   gpu.requestAdapter() → adapter.requestDevice() → device
 *   → createShaderModule / createBuffer / createRenderPipeline
 *   → createCommandEncoder() → beginRenderPass() → setPipeline/setVertexBuffer/draw
 *   → end() → finish() → queue.submit()
 *
 * CPU 内部实际执行：
 *   顶点着色器(JS) → 图元装配 → 齐次裁剪 → 视口变换 → 光栅化 → 片元着色器 → 深度/模板/混合
 */
import { BufferUsage, GPUBuffer } from './Buffer'
import { GPUSampler, GPUTexture, type GPUTextureView } from './Texture'
import { WebGPURasterizer, type ClipVertex, type GPUViewport } from './Rasterizer'
import {
    VERTEX_FORMATS,
    readVertexAttribute,
    type GPURenderPipelineDescriptor,
    type GPUShaderModule,
    type GPUBlendState,
    type InternalPipeline,
    type WGSLCode,
} from './types'

// ==================== 渲染管线 ====================

/** 编译后的渲染管线（模拟 createRenderPipeline 时的管线编译） */
export class GPURenderPipeline {
    readonly internal: InternalPipeline
    constructor(internal: InternalPipeline) {
        this.internal = internal
    }
}

// ==================== 绑定组 ====================

export interface GPUBindGroupEntry {
    binding: number
    resource: GPUBuffer | GPUTexture | GPUSampler | GPUBufferBinding
}

export interface GPUBufferBinding {
    buffer: GPUBuffer
    offset?: number
    size?: number
}

/** 绑定组：把资源按 binding 序号绑好（模拟 GPUBindGroup） */
export class GPUBindGroup {
    readonly entries: GPUBindGroupEntry[]
    constructor(entries: GPUBindGroupEntry[]) {
        this.entries = entries
    }

    /** 解析成着色器可直接读取的 bindings 表 */
    resolve(): Record<number, unknown> {
        const out: Record<number, unknown> = {}
        for (const e of this.entries) {
            if (e.resource instanceof GPUBuffer) {
                out[e.binding] = new Float32Array(e.resource.data)
            } else if (e.resource instanceof GPUTexture || e.resource instanceof GPUSampler) {
                out[e.binding] = e.resource
            } else {
                const { buffer, offset = 0 } = e.resource as GPUBufferBinding
                out[e.binding] = new Float32Array(buffer.data, offset)
            }
        }
        return out
    }
}

// ==================== 命令编码 ====================

interface DrawCommand {
    kind: 'draw' | 'drawIndexed'
    pipeline: InternalPipeline
    vertexBuffers: Map<number, { buffer: GPUBuffer; offset: number }>
    indexBuffer?: { buffer: GPUBuffer; format: 'uint16' | 'uint32'; offset: number }
    bindings: Record<number, unknown>
    vertexCount: number
    instanceCount: number
    firstVertex: number
    firstInstance: number
    firstIndex: number
    stencilRef: number
}

interface PassState {
    colorAttachment: GPUTexture | null
    depthAttachment: GPUTexture | null
    viewport: GPUViewport
    scissor: { x: number; y: number; width: number; height: number }
    commands: DrawCommand[]
}

/** 命令缓冲（encoder.finish() 产物） */
export class GPUCommandBuffer {
    constructor(readonly passes: PassState[]) {}
}

// ==================== 编码器 ====================

export interface GPUColorAttachment {
    view: GPUTextureView
    loadOp: 'clear' | 'load'
    storeOp: 'store'
    clearValue?: number[]
}

export interface GPUDepthStencilAttachment {
    view: GPUTextureView
    depthLoadOp?: 'clear' | 'load'
    depthStoreOp?: 'store'
    depthClearValue?: number
    stencilLoadOp?: 'clear' | 'load'
    stencilStoreOp?: 'store'
    stencilClearValue?: number
}

/** 命令编码器：只能记录命令，真正执行在 queue.submit */
export class GPUCommandEncoder {
    private passStates: PassState[] = []
    private finished = false

    beginRenderPass(desc: { colorAttachments: GPUColorAttachment[]; depthStencilAttachment?: GPUDepthStencilAttachment }): GPURenderPassEncoder {
        if (this.finished) throw new Error('Command encoder already finished')
        const pass = new GPURenderPassEncoder(this, desc)
        this.passStates.push(pass.passState)
        return pass
    }

    finish(): GPUCommandBuffer {
        this.finished = true
        return new GPUCommandBuffer(this.passStates)
    }
}

/** 渲染通道编码器：记录 draw 命令与状态 */
export class GPURenderPassEncoder {
    readonly passState: PassState
    private encoder: GPUCommandEncoder

    // 当前状态（对应真实 API 的 setPipeline/setVertexBuffer 等）
    private pipeline: InternalPipeline | null = null
    private vertexBuffers = new Map<number, { buffer: GPUBuffer; offset: number }>()
    private indexBuffer: { buffer: GPUBuffer; format: 'uint16' | 'uint32'; offset: number } | null = null
    private bindGroupData: Record<number, unknown> = {}
    private stencilRef = 0

    constructor(
        encoder: GPUCommandEncoder,
        desc: { colorAttachments: GPUColorAttachment[]; depthStencilAttachment?: GPUDepthStencilAttachment },
    ) {
        this.encoder = encoder
        const color = desc.colorAttachments[0]?.view ?? null
        const depth = desc.depthStencilAttachment?.view ?? null
        const w = color ? color.width : depth ? depth.width : 1
        const h = color ? color.height : depth ? depth.height : 1

        this.passState = {
            colorAttachment: color,
            depthAttachment: depth,
            viewport: { x: 0, y: 0, width: w, height: h, minDepth: 0, maxDepth: 1 },
            scissor: { x: 0, y: 0, width: w, height: h },
            commands: [],
        }

        // 执行 loadOp：'clear' 清空附件（真实 GPU 在 pass 开始时做）
        if (color) {
            const load = desc.colorAttachments[0].loadOp
            if (load === 'clear') {
                const cv = desc.colorAttachments[0].clearValue ?? [0, 0, 0, 0]
                for (let y = 0; y < color.height; y++)
                    for (let x = 0; x < color.width; x++)
                        color.writeColor(x, y, Math.round(cv[0] * 255), Math.round(cv[1] * 255), Math.round(cv[2] * 255), Math.round((cv[3] ?? 1) * 255))
            }
        }
        if (depth) {
            const d = desc.depthStencilAttachment!
            if (d.depthLoadOp === 'clear') depth.depthData?.fill(d.depthClearValue ?? 1)
            if (d.stencilLoadOp === 'clear') depth.stencilData?.fill(d.stencilClearValue ?? 0)
        }
    }

    setPipeline(pipeline: GPURenderPipeline): void {
        this.pipeline = pipeline.internal
    }

    setVertexBuffer(slot: number, buffer: GPUBuffer | null, offset = 0): void {
        if (buffer) this.vertexBuffers.set(slot, { buffer, offset })
        else this.vertexBuffers.delete(slot)
    }

    setIndexBuffer(buffer: GPUBuffer | null, format: 'uint16' | 'uint32', offset = 0): void {
        this.indexBuffer = buffer ? { buffer, format, offset } : null
    }

    setBindGroup(index: number, bindGroup: GPUBindGroup): void {
        Object.assign(this.bindGroupData, bindGroup.resolve())
    }

    setViewport(x: number, y: number, width: number, height: number, minDepth = 0, maxDepth = 1): void {
        this.passState.viewport = { x, y, width, height, minDepth, maxDepth }
    }

    setScissorRect(x: number, y: number, width: number, height: number): void {
        this.passState.scissor = { x, y, width, height }
    }

    setStencilReference(ref: number): void {
        this.stencilRef = ref
    }

    draw(vertexCount: number, instanceCount = 1, firstVertex = 0, firstInstance = 0): void {
        this.pushCommand('draw', vertexCount, instanceCount, firstVertex, firstInstance)
    }

    drawIndexed(indexCount: number, instanceCount = 1, firstIndex = 0, baseVertex = 0, firstInstance = 0): void {
        this.pushCommand('drawIndexed', indexCount, instanceCount, baseVertex, firstInstance, firstIndex)
    }

    private pushCommand(
        kind: 'draw' | 'drawIndexed',
        vertexCount: number,
        instanceCount: number,
        firstVertex: number,
        firstInstance: number,
        firstIndex = 0,
    ): void {
        if (!this.pipeline) throw new Error('No pipeline set')
        this.passState.commands.push({
            kind,
            pipeline: this.pipeline,
            vertexBuffers: new Map(this.vertexBuffers),
            indexBuffer: this.indexBuffer ?? undefined,
            bindings: { ...this.bindGroupData },
            vertexCount,
            instanceCount,
            firstVertex,
            firstInstance,
            firstIndex,
            stencilRef: this.stencilRef,
        })
    }

    end(): void {
        // pass 结束：命令已入队，无需额外处理
    }
}

// ==================== 设备与队列 ====================

/** 队列：提交命令缓冲、写缓冲（模拟 GPUQueue） */
export class GPUQueue {
    constructor(private device: GPUDevice) {}

    submit(commandBuffers: GPUCommandBuffer[]): void {
        for (const cb of commandBuffers) {
            for (const pass of cb.passes) this.device.executePass(pass)
        }
    }

    /** 写数据到缓冲（真实 API：queue.writeBuffer(buffer, bufferOffset, data)） */
    writeBuffer(buffer: GPUBuffer, bufferOffset: number, data: ArrayLike<number> | ArrayBufferView | ArrayBuffer): void {
        buffer.writeData(data, bufferOffset)
    }
}

/** 设备：创建资源与管线（模拟 GPUDevice） */
export class GPUDevice {
    readonly queue: GPUQueue
    constructor() {
        this.queue = new GPUQueue(this)
    }

    createShaderModule(desc: { code: WGSLCode }): GPUShaderModule {
        return { code: desc.code }
    }

    createBuffer(desc: { size: number; usage: number; mappedAtCreation?: boolean }): GPUBuffer {
        return new GPUBuffer(desc)
    }

    createTexture(desc: { size: [number, number] | { width: number; height: number; depthOrArrayLayers?: number }; format: string; usage: number }): GPUTexture {
        return new GPUTexture(desc as never)
    }

    createSampler(desc: object = {}): GPUSampler {
        return new GPUSampler(desc as never)
    }

    createBindGroup(desc: { entries: GPUBindGroupEntry[] }): GPUBindGroup {
        return new GPUBindGroup(desc.entries)
    }

    createBindGroupLayout(desc: object): object {
        return desc
    }

    createPipelineLayout(desc: object): object {
        return desc
    }

    /** 编译渲染管线：把所有状态固化（不可变） */
    createRenderPipeline(desc: GPURenderPipelineDescriptor): GPURenderPipeline {
        const vs = desc.vertex.module.code
        const fs = desc.fragment?.module.code
        const primitive = desc.primitive ?? {}
        const depthStencil = desc.depthStencil
        const hasStencil = !!depthStencil && depthStencil.format.includes('stencil')

        const internal: InternalPipeline = {
            vertexFn: vs.vertex,
            fragmentFn: fs?.fragment,
            buffers: desc.vertex.buffers ?? [],
            topology: primitive.topology ?? 'triangle-list',
            frontFace: primitive.frontFace ?? 'ccw',
            cullMode: primitive.cullMode ?? 'none',
            depth: depthStencil
                ? {
                      write: depthStencil.depthWriteEnabled ?? false,
                      compare: depthStencil.depthCompare ?? 'always',
                      format: depthStencil.format,
                  }
                : undefined,
            stencil:
                hasStencil || depthStencil?.stencilFront || depthStencil?.stencilBack
                    ? {
                          front: depthStencil?.stencilFront ?? {},
                          back: depthStencil?.stencilBack ?? {},
                          readMask: depthStencil?.stencilReadMask ?? 0xffffffff,
                          writeMask: depthStencil?.stencilWriteMask ?? 0xffffffff,
                      }
                    : undefined,
            blend: desc.fragment?.targets.map((t) => t.blend).filter((b): b is GPUBlendState => !!b),
            fragmentTargets: desc.fragment?.targets ?? [],
            hasDepthAttachment: !!depthStencil,
            hasStencilAttachment: hasStencil,
        }
        return new GPURenderPipeline(internal)
    }

    createCommandEncoder(): GPUCommandEncoder {
        return new GPUCommandEncoder()
    }

    // ==================== CPU 执行（对应真实 GPU 的硬件管线）====================

    /** 执行一个 render pass：逐命令执行顶点/片元管线 */
    executePass(pass: PassState): void {
        const { colorAttachment, depthAttachment, viewport, scissor, commands } = pass

        for (const cmd of commands) {
            const pipeline = cmd.pipeline
            const vertexFn = pipeline.vertexFn
            if (!vertexFn) continue

            // 1. 跑顶点着色器（实例化循环），得到裁剪空间顶点
            const clipVertices: ClipVertex[] = []
            if (cmd.kind === 'draw') {
                for (let inst = 0; inst < cmd.instanceCount; inst++) {
                    const instanceIndex = cmd.firstInstance + inst
                    for (let v = 0; v < cmd.vertexCount; v++) {
                        const vertexId = cmd.firstVertex + v
                        clipVertices.push(vertexFn(this.buildVertexInput(pipeline, cmd, vertexId, instanceIndex)))
                    }
                }
            } else {
                // drawIndexed：索引 + baseVertex 决定顶点 id
                for (let inst = 0; inst < cmd.instanceCount; inst++) {
                    const instanceIndex = cmd.firstInstance + inst
                    for (let i = 0; i < cmd.vertexCount; i++) {
                        const index = cmd.indexBuffer!.buffer.readIndex(cmd.firstIndex + i, cmd.indexBuffer!.format)
                        const vertexId = index + cmd.firstVertex // baseVertex
                        clipVertices.push(vertexFn(this.buildVertexInput(pipeline, cmd, vertexId, instanceIndex)))
                    }
                }
            }

            // 2. 光栅化
            const rasterizer = new WebGPURasterizer({
                colorAttachment,
                depthAttachment,
                viewport,
                scissor,
                pipeline,
                bindings: cmd.bindings,
                stencilRef: cmd.stencilRef,
            })
            rasterizer.draw(clipVertices, pipeline.topology)
        }
    }

    /** 按管线顶点布局从顶点缓冲读取属性，构造着色器输入 */
    private buildVertexInput(
        pipeline: InternalPipeline,
        cmd: DrawCommand,
        vertexId: number,
        instanceIndex: number,
    ): { location: (i: number) => Float32Array | null; vertexIndex: number; instanceIndex: number; bindings: Record<number, unknown> } {
        const locationMap = new Map<number, Float32Array>()
        pipeline.buffers.forEach((layout, slot) => {
            const binding = cmd.vertexBuffers.get(slot)
            if (!binding) return
            const step = layout.stepMode === 'instance' ? instanceIndex : vertexId
            const base = binding.offset + step * layout.arrayStride
            const view = new DataView(binding.buffer.data)
            for (const attr of layout.attributes) {
                const fmt = VERTEX_FORMATS[attr.format]
                if (!fmt) continue
                if (base + attr.offset + fmt.bytes > binding.buffer.size) continue
                locationMap.set(attr.shaderLocation, readVertexAttribute(view, base + attr.offset, attr.format))
            }
        })
        return {
            location: (i) => locationMap.get(i) ?? null,
            vertexIndex: vertexId,
            instanceIndex,
            bindings: cmd.bindings,
        }
    }
}

// ==================== 适配器与入口 ====================

/** 适配器：代表一个 GPU（模拟 GPUAdapter） */
export class GPUAdapter {
    async requestDevice(): Promise<GPUDevice> {
        return new GPUDevice()
    }
}

/** 入口：模拟 navigator.gpu */
export class GPU {
    async requestAdapter(): Promise<GPUAdapter> {
        return new GPUAdapter()
    }

    /** 获取 canvas 的 webgpu 上下文（真实 API 是 canvas.getContext('webgpu')） */
    getCanvasContext(canvas: HTMLCanvasElement): GPUCanvasContext {
        return new GPUCanvasContext(canvas)
    }
}

/** 画布上下文：configure 后 getCurrentTexture() 获得渲染目标（模拟 GPUCanvasContext） */
export class GPUCanvasContext {
    private device: GPUDevice | null = null
    private texture: GPUTexture | null = null
    private canvas: HTMLCanvasElement

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
    }

    configure(desc: { device: GPUDevice; format: string; width?: number; height?: number }): void {
        this.device = desc.device
        const w = desc.width ?? this.canvas.width
        const h = desc.height ?? this.canvas.height
        this.texture = new GPUTexture({ size: [w, h], format: desc.format as never, usage: 0x10 })
    }

    getCurrentTexture(): GPUTexture {
        if (!this.texture) throw new Error('Context not configured')
        return this.texture
    }
}

/** 单例入口（对应 navigator.gpu） */
export const gpu = new GPU()

export type { GPUShaderModule }
export { BufferUsage }
