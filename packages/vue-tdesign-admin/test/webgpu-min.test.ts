// 最小化排查：drawIndexed + float32x3 位置 + 常量颜色
import { gpu, Vec4, type WGSLCode } from './src/views/graphics/engine/raster/webgpu/index'
import { BufferUsage } from './src/views/graphics/engine/raster/webgpu/Buffer'

const device = await (await gpu.requestAdapter()).requestDevice()
const SIZE = 200
const fakeCanvas = { width: SIZE, height: SIZE, getContext: () => null } as unknown as HTMLCanvasElement
const gpuCtx = gpu.getCanvasContext(fakeCanvas)
gpuCtx.configure({ device, format: 'rgba8unorm', width: SIZE, height: SIZE })
const tex = gpuCtx.getCurrentTexture()

const vs: WGSLCode = {
    source: 't',
    vertex(input) {
        const p = input.location(0)!
        return { position: new Vec4(p[0], p[1], p[2], 1), varyings: [1, 0, 0, 1] }
    },
}
const pipe = device.createRenderPipeline({
    vertex: { module: device.createShaderModule({ code: vs }), buffers: [{ arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }] }] },
    fragment: { module: device.createShaderModule({ code: vs }), targets: [{ format: 'rgba8unorm' }] },
})
const vb = device.createBuffer({ size: 4 * 12, usage: BufferUsage.VERTEX })
device.queue.writeBuffer(vb, 0, new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]))
const ib = device.createBuffer({ size: 6 * 2, usage: BufferUsage.INDEX })
device.queue.writeBuffer(ib, 0, new Uint16Array([0, 1, 2, 0, 2, 3]))

{
    const enc = device.createCommandEncoder()
    const pass = enc.beginRenderPass({ colorAttachments: [{ view: tex.createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1] }] })
    pass.setPipeline(pipe)
    pass.setVertexBuffer(0, vb)
    pass.setIndexBuffer(ib, 'uint16')
    pass.drawIndexed(6)
    pass.end()
    device.queue.submit([enc.finish()])
}
console.log('drawIndexed+float32x3 center =', tex.readColor(100, 100).join(','))
console.log('corner =', tex.readColor(10, 10).join(','))
