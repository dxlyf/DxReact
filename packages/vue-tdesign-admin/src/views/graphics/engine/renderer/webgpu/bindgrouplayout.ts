import type { Device } from "./device";
import type { ICacheableResource } from "./resource";

/**
 * 绑定组布局封装（对应 GPUBindGroupLayout）
 * GPUBindGroupLayout 无 destroy 方法，dispose 仅从 Device 注销。
 * 由 Device.createBindGroupLayout 按结构去重，cacheKey 用于销毁时清缓存。
 */
export class BindGroupLayout implements ICacheableResource {
    static uid = 0

    isDisposed = false
    readonly uid: number
    device: Device
    layout: GPUBindGroupLayout
    /** 结构去重缓存键 */
    cacheKey?: string

    constructor(device: Device, descriptor: GPUBindGroupLayoutDescriptor) {
        this.device = device
        this.uid = BindGroupLayout.uid++
        this.layout = device.gpu.createBindGroupLayout(descriptor)
        device.addDisposable(this)
    }

    dispose(): void {
        if (this.isDisposed) { return }
        this.isDisposed = true
        this.device.resources.delete(this)
        this.device.removeFromCache(this.cacheKey)
    }
}
