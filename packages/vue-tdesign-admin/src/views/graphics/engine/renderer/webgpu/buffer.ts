import type { Device } from "./device";
import type { IResource } from "./resource";

/**
 * GPU 缓冲区封装（对应 GPUBuffer）
 * - 构造时由 Device 立即创建原生 GPUBuffer，并登记到 Device.resources
 * - 写入走 Device.queue.writeBuffer，避免自行维护映射状态
 */
export class Buffer implements IResource {
    static uid = 0

    isDisposed = false
    readonly uid: number
    device: Device
    buffer: GPUBuffer
    /** 缓冲区字节大小 */
    readonly size: number
    /** 使用方式位掩码（GPUBufferUsage） */
    readonly usage: GPUFlagsConstant

    constructor(device: Device, descriptor: GPUBufferDescriptor) {
        this.device = device
        this.uid = Buffer.uid++
        this.buffer = device.gpu.createBuffer(descriptor)
        this.size = this.buffer.size
        this.usage = this.buffer.usage
        device.addDisposable(this)
    }

    protected get gpu() {
        return this.device.gpu
    }

    /** 通过队列写入数据（对应 GPUQueue.writeBuffer） */
    write(data: GPUAllowSharedBufferSource, bufferOffset = 0, dataOffset?: GPUSize64, size?: GPUSize64) {
        this.gpu.queue.writeBuffer(this.buffer, bufferOffset, data, dataOffset, size)
    }
    /** 映射缓冲区内容以便 CPU 访问 */
    mapAsync(mode: GPUMapModeFlags, offset?: GPUSize64, size?: GPUSize64) {
        return this.buffer.mapAsync(mode, offset, size)
    }
    getMappedRange(offset?: GPUSize64, size?: GPUSize64) {
        return this.buffer.getMappedRange(offset, size)
    }
    unmap() {
        this.buffer.unmap()
    }
    destroy() {
        this.buffer.destroy()
    }
    dispose(): void {
        if (this.isDisposed) { return }
        this.isDisposed = true
        this.buffer.destroy()
        this.device.resources.delete(this)
    }
}
