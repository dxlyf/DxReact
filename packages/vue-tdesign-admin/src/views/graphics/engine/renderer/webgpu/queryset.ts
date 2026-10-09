import type { Device } from "./device";
import type { IResource } from "./resource";

/**
 * 查询集封装（对应 GPUQuerySet）
 * 用于遮挡查询 / 时间戳查询，配合 CommandEncoder.resolveQuerySet 读取结果。
 */
export class QuerySet implements IResource {
    static uid = 0

    isDisposed = false
    readonly uid: number
    device: Device
    querySet: GPUQuerySet

    constructor(device: Device, descriptor: GPUQuerySetDescriptor) {
        this.device = device
        this.uid = QuerySet.uid++
        this.querySet = device.gpu.createQuerySet(descriptor)
        device.addDisposable(this)
    }

    /** 查询类型（occlusion / timestamp） */
    get type(): GPUQueryType {
        return this.querySet.type
    }
    /** 查询条目数量 */
    get count(): number {
        return this.querySet.count
    }
    destroy() {
        this.querySet.destroy()
    }
    dispose(): void {
        if (this.isDisposed) { return }
        this.isDisposed = true
        this.querySet.destroy()
        this.device.resources.delete(this)
    }
}
