import type { Device } from "./device";
import type { ICacheableResource } from "./resource";

/**
 * 采样器封装（对应 GPUSampler）
 * GPUSampler 无 destroy 方法，dispose 仅从 Device 注销。
 * 由 Device.createSampler 按描述符结构去重；相同配置会复用同一采样器。
 */
export class Sampler implements ICacheableResource {
    static uid = 0

    isDisposed = false
    readonly uid: number
    device: Device
    sampler: GPUSampler
    /** 结构去重缓存键 */
    cacheKey?: string

    constructor(device: Device, descriptor?: GPUSamplerDescriptor) {
        this.device = device
        this.uid = Sampler.uid++
        this.sampler = device.gpu.createSampler(descriptor)
        device.addDisposable(this)
    }

    /** 线性过滤预设（三方向线性 + mip 线性插值），走 Device 缓存复用 */
    static linear(device: Device): Sampler {
        return device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
        })
    }

    /** 最近邻过滤预设（像素风 / 精确采样），走 Device 缓存复用 */
    static nearest(device: Device): Sampler {
        return device.createSampler({
            magFilter: 'nearest',
            minFilter: 'nearest',
            mipmapFilter: 'nearest',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
        })
    }

    dispose(): void {
        if (this.isDisposed) { return }
        this.isDisposed = true
        this.device.resources.delete(this)
        this.device.removeFromCache(this.cacheKey)
    }
}
