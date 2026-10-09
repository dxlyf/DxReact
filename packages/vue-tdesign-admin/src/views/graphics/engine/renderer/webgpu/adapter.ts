import { Device } from "./device";

/**
 * GPU 适配器封装（对应 GPUAdapter）
 * 适配器是一次性资源：requestDevice 成功后被消费，无法再次创建设备。
 * 适配器本身没有 destroy / 生命周期回收，故不实现 IResource。
 */
export class Adapter {
    readonly adapter: GPUAdapter
    readonly features: GPUSupportedFeatures
    readonly limits: GPUSupportedLimits

    constructor(adapter: GPUAdapter) {
        this.adapter = adapter
        this.features = adapter.features
        this.limits = adapter.limits
    }

    get info(): GPUAdapterInfo {
        return this.adapter.info
    }
    /** 是否为软件回退适配器（取自 GPUAdapterInfo） */
    get isFallbackAdapter(): boolean {
        return this.adapter.info.isFallbackAdapter
    }
    /** 查询适配器是否支持某特性 */
    hasFeature(name: GPUFeatureName): boolean {
        return this.features.has(name)
    }
    /** 请求设备并封装为 Device */
    async requestDevice(descriptor?: GPUDeviceDescriptor): Promise<Device> {
        const gpu = await this.adapter.requestDevice(descriptor)
        return new Device(this, gpu)
    }
}
