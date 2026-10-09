import type { Device } from "./device";
import type { ICacheableResource } from "./resource";

/**
 * 着色器模块封装（对应 GPUShaderModule）
 * GPUShaderModule 无 destroy 方法，dispose 仅从 Device 注销。
 * 由 Device.createShaderModule 按 WGSL 源码等结构去重。
 */
export class ShaderModule implements ICacheableResource {
    static uid = 0

    isDisposed = false
    readonly uid: number
    device: Device
    module: GPUShaderModule
    /** 结构去重缓存键 */
    cacheKey?: string

    constructor(device: Device, descriptor: GPUShaderModuleDescriptor) {
        this.device = device
        this.uid = ShaderModule.uid++
        this.module = device.gpu.createShaderModule(descriptor)
        device.addDisposable(this)
    }

    /** 获取编译信息（用于收集 WGSL 编译告警/错误） */
    getCompilationInfo() {
        return this.module.getCompilationInfo()
    }
    dispose(): void {
        if (this.isDisposed) { return }
        this.isDisposed = true
        this.device.resources.delete(this)
        this.device.removeFromCache(this.cacheKey)
    }
}
