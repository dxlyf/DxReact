import type { Device } from "./device";
import type { ICacheableResource } from "./resource";

/**
 * 计算管线封装（对应 GPUComputePipeline）
 * GPUComputePipeline 无 destroy 方法，dispose 仅从 Device 注销。
 * 由 Device.createComputePipeline 按描述符结构去重（重复创建开销大）。
 */
export class ComputePipeline implements ICacheableResource {
    static uid = 0

    isDisposed = false
    readonly uid: number
    device: Device
    pipeline: GPUComputePipeline
    /** 结构去重缓存键 */
    cacheKey?: string

    constructor(device: Device, descriptor: GPUComputePipelineDescriptor) {
        this.device = device
        this.uid = ComputePipeline.uid++
        this.pipeline = device.gpu.createComputePipeline(descriptor)
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
