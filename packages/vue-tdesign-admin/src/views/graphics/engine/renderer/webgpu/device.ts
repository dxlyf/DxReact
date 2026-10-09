import { EventEmitter } from "@dxyl/math2";
import type { ICacheableResource, IResource } from "./resource";
import { structKey } from "./cache";
import type { Adapter } from "./adapter";
import { Buffer } from "./buffer";
import { Texture } from "./texture";
import { Sampler } from "./sampler";
import { BindGroupLayout } from "./bindgrouplayout";
import { PipelineLayout } from "./pipelinelayout";
import { BindGroup } from "./bindgroup";
import { ShaderModule } from "./shadermodule";
import { ComputePipeline } from "./computepipeline";
import { RenderPipeline } from "./renderpipeline";
import { CommandEncoder } from "./commandencoder";
import { RenderBundleEncoder } from "./renderbundleencoder";
import { QuerySet } from "./queryset";

type DeviceEvents = {
    'devicelost': [device: Device, info: GPUDeviceLostInfo]
    'uncapturederror': [device: Device, error: GPUUncapturedErrorEvent]
    'dispose': [device: Device]
}

/**
 * WebGPU 设备（核心）。
 * 类比 WebGL 的 Context：
 * - 持有原生 GPUDevice / GPUQueue，作为全部资源的创建入口（工厂方法）
 * - 统一登记资源（resources），dispose 时集中回收
 * - 转发设备丢失 / 未捕获错误事件
 * 注意：WebGPU 设备丢失后不会自动恢复，需继续渲染时必须重新 requestAdapter/requestDevice。
 */
export class Device extends EventEmitter<DeviceEvents> {
    /** 来源适配器 */
    adapter: Adapter
    /** 原生 GPUDevice */
    gpu: GPUDevice
    /** 已登记资源集合 */
    resources = new Set<IResource>()
    /** 结构去重缓存：命名空间前缀 key → 资源 */
    cache = new Map<string, ICacheableResource>()
    /** 未捕获错误监听回调，dispose 时注销 */
    protected onUncapturedErrorHandler?: (e: Event) => void

    constructor(adapter: Adapter, gpu: GPUDevice) {
        super()
        this.adapter = adapter
        this.gpu = gpu
        this.listenEvents()
    }

    get queue(): GPUQueue {
        return this.gpu.queue
    }
    get features(): GPUSupportedFeatures {
        return this.gpu.features
    }
    get limits(): GPUSupportedLimits {
        return this.gpu.limits
    }
    get adapterInfo(): GPUAdapterInfo {
        return this.gpu.adapterInfo
    }
    /** 查询设备是否支持某特性 */
    supports(name: GPUFeatureName): boolean {
        return this.gpu.features.has(name)
    }

    /** 监听设备丢失与未捕获错误 */
    protected listenEvents() {
        this.gpu.lost.then((info) => {
            this.emit('devicelost', this, info)
        })
        this.onUncapturedErrorHandler = (e: Event) => {
            this.emit('uncapturederror', this, e as GPUUncapturedErrorEvent)
        }
        this.gpu.addEventListener('uncapturederror', this.onUncapturedErrorHandler)
    }

    createBuffer(descriptor: GPUBufferDescriptor) {
        return new Buffer(this, descriptor)
    }
    createTexture(descriptor: GPUTextureDescriptor) {
        return new Texture(this, descriptor)
    }
    createSampler(descriptor?: GPUSamplerDescriptor) {
        return this.cached('sampler:' + structKey(descriptor ?? null), () => new Sampler(this, descriptor))
    }
    createBindGroupLayout(descriptor: GPUBindGroupLayoutDescriptor) {
        return this.cached('bgl:' + structKey(descriptor), () => new BindGroupLayout(this, descriptor))
    }
    createPipelineLayout(descriptor: GPUPipelineLayoutDescriptor) {
        return this.cached('pl:' + structKey(descriptor), () => new PipelineLayout(this, descriptor))
    }
    createBindGroup(descriptor: GPUBindGroupDescriptor) {
        return this.cached('bg:' + structKey(descriptor), () => new BindGroup(this, descriptor))
    }
    createShaderModule(descriptor: GPUShaderModuleDescriptor) {
        return this.cached('sm:' + structKey(descriptor), () => new ShaderModule(this, descriptor))
    }
    createComputePipeline(descriptor: GPUComputePipelineDescriptor) {
        return this.cached('cp:' + structKey(descriptor), () => new ComputePipeline(this, descriptor))
    }
    createRenderPipeline(descriptor: GPURenderPipelineDescriptor) {
        return this.cached('rp:' + structKey(descriptor), () => new RenderPipeline(this, descriptor))
    }
    createCommandEncoder(descriptor?: GPUCommandEncoderDescriptor) {
        return new CommandEncoder(this, descriptor)
    }
    createRenderBundleEncoder(descriptor: GPURenderBundleEncoderDescriptor) {
        return new RenderBundleEncoder(this, descriptor)
    }
    createQuerySet(descriptor: GPUQuerySetDescriptor) {
        return new QuerySet(this, descriptor)
    }

    /** 提交命令缓冲（对应 GPUQueue.submit） */
    submit(commandBuffers: Iterable<GPUCommandBuffer>) {
        this.gpu.queue.submit(commandBuffers)
    }
    /** 等待已提交工作完成 */
    onSubmittedWorkDone() {
        return this.gpu.queue.onSubmittedWorkDone()
    }

    addDisposable(resource: IResource) {
        this.resources.add(resource)
    }
    /**
     * 结构去重：命中且未销毁则复用，否则用 factory 创建并记录 cacheKey
     * 创建开销大的资源（bindGroupLayout / pipelineLayout / bindGroup / shaderModule / pipeline / sampler）走这里
     */
    protected cached<T extends ICacheableResource>(key: string, factory: () => T): T {
        const existing = this.cache.get(key)
        if (existing && !existing.isDisposed) {
            return existing as T
        }
        const resource = factory()
        resource.cacheKey = key
        this.cache.set(key, resource)
        return resource
    }
    /** 资源销毁时从缓存移除；未指定 key 则忽略 */
    removeFromCache(key?: string) {
        if (key !== undefined) {
            this.cache.delete(key)
        }
    }
    dispose() {
        this.emit('dispose', this)
        this.resources.forEach((resource) => resource.dispose())
        this.resources.clear()
        this.cache.clear()
        if (this.onUncapturedErrorHandler) {
            this.gpu.removeEventListener('uncapturederror', this.onUncapturedErrorHandler)
            this.onUncapturedErrorHandler = undefined
        }
        this.gpu.destroy()
    }
}
