// 对照：GPUCanvasContext 纹理 vs createTexture（都带 fragment）
import { gpu, Vec4, type WGSLCode } from './src/views/graphics/engine/raster/webgpu/index'
import { BufferUsage } from './src/views/graphics/engine/raster/webgpu/Buffer'

const device = await (await gpu.requestAdapter()).requestDevice()
const SIZE = 200

const vs: WGSLCode = {
    source: 't',
    vertex(input) {
        const p = input.location(0)!
        return { position: new Vec4(p[0], p[1], 0.5, 1), varyings: [1, 0, 0, 1] }
    },
}
const fs: WGSLCode = { source: 'f', fragment() { return new Vec4(1, 0, 0, 1) } }
const pipe = device.createRenderPipeline({
    vertex: { module: device.createShaderModule({ code: vs }), buffers: [{ arrayStride: 8, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }] }] },
    fragment: { module: device.createShaderModule({ code: fs }), targets: [{ format: 'rgba8unorm' }] },
})
const vb = device.createBuffer({ size: 3 * 8, usage: BufferUsage.VERTEX })
device.queue.writeBuffer(vb, 0, new Float32Array([-1, -1, 1, -1, -1, 1]))

function drawTo(tex: { createView(): unknown; readColor(x: number, y: number): unknown }): void {
    const enc = device.createCommandEncoder()
    const pass = enc.beginRenderPass({ colorAttachments: [{ view: tex.createView() as never, loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1] }] })
    pass.setPipeline(pipe)
    pass.setVertexBuffer(0, vb)
    pass.draw(3)
    pass.end()
    device.queue.submit([enc.finish()])
}

// A: createTexture
const t1 = device.createTexture({ size: [SIZE, SIZE], format: 'rgba8unorm', usage: 0x10 })
drawTo(t1)
console.log('createTexture =', t1.readColor(100, 100).join(','))

// B: GPUCanvasContext
const fakeCanvas = { width: SIZE, height: SIZE, getContext: () => null } as unknown as HTMLCanvasElement
const gpuCtx = gpu.getCanvasContext(fakeCanvas)
gpuCtx.configure({ device, format: 'rgba8unorm', width: SIZE, height: SIZE })
const t2 = gpuCtx.getCurrentTexture()
drawTo(t2)
console.log('canvasCtx =', t2.readColor(100, 100).join(','))

// C: canvasCtx 但使用 configure 时直接传 SIZE
const gpuCtx2 = gpu.getCanvasContext(fakeCanvas)
gpuCtx2.configure({ device, format: 'rgba8unorm', width: SIZE, height: SIZE })
const t3 = gpuCtx2.getCurrentTexture()
console.log('canvasCtx size =', t3.width, t3.height, 'format =', t3.format, 'colorData?', !!t3.colorData)
