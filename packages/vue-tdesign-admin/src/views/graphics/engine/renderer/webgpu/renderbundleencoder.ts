import type { Device } from "./device";
import type { IResource } from "./resource";

/**
 * 渲染包编码器封装（对应 GPURenderBundleEncoder）
 * 用于把一组绘制命令预先录制为 GPURenderBundle，之后可在多个 pass 中复用。
 * 注意：与 pass encoder 不同，这里不含 setViewport / setScissorRect。
 */
export class RenderBundleEncoder implements IResource {
    static uid = 0

    isDisposed = false
    readonly uid: number
    device: Device
    encoder: GPURenderBundleEncoder

    constructor(device: Device, descriptor: GPURenderBundleEncoderDescriptor) {
        this.device = device
        this.uid = RenderBundleEncoder.uid++
        this.encoder = device.gpu.createRenderBundleEncoder(descriptor)
        device.addDisposable(this)
    }

    setPipeline(pipeline: GPURenderPipeline) {
        this.encoder.setPipeline(pipeline)
    }
    setBindGroup(index: GPUIndex32, bindGroup: GPUBindGroup | null | undefined, dynamicOffsets?: Iterable<GPUBufferDynamicOffset>) {
        this.encoder.setBindGroup(index, bindGroup, dynamicOffsets)
    }
    setVertexBuffer(slot: GPUIndex32, buffer: GPUBuffer | null | undefined, offset?: GPUSize64, size?: GPUSize64) {
        this.encoder.setVertexBuffer(slot, buffer, offset, size)
    }
    setIndexBuffer(buffer: GPUBuffer, indexFormat: GPUIndexFormat, offset?: GPUSize64, size?: GPUSize64) {
        this.encoder.setIndexBuffer(buffer, indexFormat, offset, size)
    }
    draw(vertexCount: GPUSize32, instanceCount?: GPUSize32, firstVertex?: GPUSize32, firstInstance?: GPUSize32) {
        this.encoder.draw(vertexCount, instanceCount, firstVertex, firstInstance)
    }
    drawIndexed(indexCount: GPUSize32, instanceCount?: GPUSize32, firstIndex?: GPUSize32, baseVertex?: GPUSignedOffset32, firstInstance?: GPUSize32) {
        this.encoder.drawIndexed(indexCount, instanceCount, firstIndex, baseVertex, firstInstance)
    }
    drawIndirect(indirectBuffer: GPUBuffer, indirectOffset: GPUSize64) {
        this.encoder.drawIndirect(indirectBuffer, indirectOffset)
    }
    drawIndexedIndirect(indirectBuffer: GPUBuffer, indirectOffset: GPUSize64) {
        this.encoder.drawIndexedIndirect(indirectBuffer, indirectOffset)
    }
    /** 结束录制并产出渲染包 */
    finish(descriptor?: GPURenderBundleDescriptor) {
        return this.encoder.finish(descriptor)
    }
    dispose(): void {
        if (this.isDisposed) { return }
        this.isDisposed = true
        this.device.resources.delete(this)
    }
}
