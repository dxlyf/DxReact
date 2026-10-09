import type { Device } from "./device";
import type { IResource } from "./resource";

/**
 * 命令编码器封装（对应 GPUCommandEncoder）
 * - beginRenderPass / beginComputePass 返回原生 pass encoder，交由上层继续录制
 * - finish() 产出 GPUCommandBuffer，可直接交给 Device.submit()
 */
export class CommandEncoder implements IResource {
    static uid = 0

    isDisposed = false
    readonly uid: number
    device: Device
    encoder: GPUCommandEncoder

    constructor(device: Device, descriptor?: GPUCommandEncoderDescriptor) {
        this.device = device
        this.uid = CommandEncoder.uid++
        this.encoder = device.gpu.createCommandEncoder(descriptor)
        device.addDisposable(this)
    }

    beginRenderPass(descriptor: GPURenderPassDescriptor) {
        return this.encoder.beginRenderPass(descriptor)
    }
    beginComputePass(descriptor?: GPUComputePassDescriptor) {
        return this.encoder.beginComputePass(descriptor)
    }
    /** 缓冲区到缓冲区拷贝（两种重载：整段 / 带偏移） */
    copyBufferToBuffer(source: GPUBuffer, destination: GPUBuffer, size?: GPUSize64): undefined
    copyBufferToBuffer(source: GPUBuffer, sourceOffset: GPUSize64, destination: GPUBuffer, destinationOffset: GPUSize64, size?: GPUSize64): undefined
    copyBufferToBuffer(source: GPUBuffer, second: GPUBuffer | GPUSize64, third?: GPUBuffer | GPUSize64, fourth?: GPUSize64, fifth?: GPUSize64): undefined {
        if (typeof second === "number") {
            this.encoder.copyBufferToBuffer(source, second, third as GPUBuffer, fourth as GPUSize64, fifth)
        }
        else {
            this.encoder.copyBufferToBuffer(source, second, third as GPUSize64 | undefined)
        }
        return undefined
    }
    copyBufferToTexture(source: GPUTexelCopyBufferInfo, destination: GPUTexelCopyTextureInfo, copySize: GPUExtent3DStrict) {
        this.encoder.copyBufferToTexture(source, destination, copySize)
    }
    copyTextureToBuffer(source: GPUTexelCopyTextureInfo, destination: GPUTexelCopyBufferInfo, copySize: GPUExtent3DStrict) {
        this.encoder.copyTextureToBuffer(source, destination, copySize)
    }
    copyTextureToTexture(source: GPUTexelCopyTextureInfo, destination: GPUTexelCopyTextureInfo, copySize: GPUExtent3DStrict) {
        this.encoder.copyTextureToTexture(source, destination, copySize)
    }
    /** 以 0 填充缓冲区的一段区间 */
    clearBuffer(buffer: GPUBuffer, offset?: GPUSize64, size?: GPUSize64) {
        this.encoder.clearBuffer(buffer, offset, size)
    }
    /** 把查询集结果解析到缓冲区 */
    resolveQuerySet(querySet: GPUQuerySet, firstQuery: GPUSize32, queryCount: GPUSize32, destination: GPUBuffer, destinationOffset: GPUSize64) {
        this.encoder.resolveQuerySet(querySet, firstQuery, queryCount, destination, destinationOffset)
    }
    /** 结束录制并产出命令缓冲 */
    finish(descriptor?: GPUCommandBufferDescriptor) {
        return this.encoder.finish(descriptor)
    }
    dispose(): void {
        if (this.isDisposed) { return }
        this.isDisposed = true
        this.device.resources.delete(this)
    }
}
