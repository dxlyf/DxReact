import type { Device } from "./device";
import type { ICacheableResource } from "./resource";

/**
 * 渲染管线封装（对应 GPURenderPipeline）
 * GPURenderPipeline 无 destroy 方法，dispose 仅从 Device 注销。
 * 由 Device.createRenderPipeline 按描述符结构去重（创建昂贵，务必复用）。
 */
export class RenderPipeline implements ICacheableResource {
    static uid = 0

    isDisposed = false
    readonly uid: number
    device: Device
    pipeline: GPURenderPipeline
    /** 结构去重缓存键 */
    cacheKey?: string

    constructor(device: Device, descriptor: GPURenderPipelineDescriptor) {
        this.device = device
        this.uid = RenderPipeline.uid++
        this.pipeline = device.gpu.createRenderPipeline(descriptor)
        device.addDisposable(this)
    }

    /** 获取管线内某个绑组对应的布局 */
    getBindGroupLayout(index: number) {
        return this.pipeline.getBindGroupLayout(index)
    }
    dispose(): void {
        if (this.isDisposed) { return }
        this.isDisposed = true
        this.device.resources.delete(this)
        this.device.removeFromCache(this.cacheKey)
    }
}
