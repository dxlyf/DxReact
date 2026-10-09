import type { Device } from "./device";
import type { ICacheableResource } from "./resource";

/**
 * 绑定组封装（对应 GPUBindGroup）
 * GPUBindGroup 无 destroy 方法，dispose 仅从 Device 注销。
 * 由 Device.createBindGroup 按（布局 + 资源集合）结构去重。
 */
export class BindGroup implements ICacheableResource {
    static uid = 0

    isDisposed = false
    readonly uid: number
    device: Device
    group: GPUBindGroup
    /** 结构去重缓存键 */
    cacheKey?: string

    constructor(device: Device, descriptor: GPUBindGroupDescriptor) {
        this.device = device
        this.uid = BindGroup.uid++
        this.group = device.gpu.createBindGroup(descriptor)
        device.addDisposable(this)
    }

    dispose(): void {
        if (this.isDisposed) { return }
        this.isDisposed = true
        this.device.resources.delete(this)
        this.device.removeFromCache(this.cacheKey)
    }
}
