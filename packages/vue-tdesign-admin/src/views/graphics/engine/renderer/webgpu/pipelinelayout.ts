import type { Device } from "./device";
import type { ICacheableResource } from "./resource";

/**
 * 管线布局封装（对应 GPUPipelineLayout）
 * GPUPipelineLayout 无 destroy 方法，dispose 仅从 Device 注销。
 * 由 Device.createPipelineLayout 按结构去重。
 */
export class PipelineLayout implements ICacheableResource {
    static uid = 0

    isDisposed = false
    readonly uid: number
    device: Device
    layout: GPUPipelineLayout
    /** 结构去重缓存键 */
    cacheKey?: string

    constructor(device: Device, descriptor: GPUPipelineLayoutDescriptor) {
        this.device = device
        this.uid = PipelineLayout.uid++
        this.layout = device.gpu.createPipelineLayout(descriptor)
        device.addDisposable(this)
    }

    dispose(): void {
        if (this.isDisposed) { return }
        this.isDisposed = true
        this.device.resources.delete(this)
        this.device.removeFromCache(this.cacheKey)
    }
}
