// 最小排查 2：最基础的 draw(3) 三角形，走 GPUCanvasContext
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
        return { position: new Vec4(p[0], p[1], 0.5, 1), varyings: [1, 0, 0, 1] }
    },
}
const pipe = device.createRenderPipeline({
    vertex: { module: device.createShaderModule({ code: vs }), buffers: [{ arrayStride: 8, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }] }] },
    fragment: { module: device.createShaderModule({ code: vs }), targets: [{ format: 'rgba8unorm' }] },
})
const vb = device.createBuffer({ size: 3 * 8, usage: BufferUsage.VERTEX })
device.queue.writeBuffer(vb, 0, new Float32Array([-1, -1, 1, -1, -1, 1]))

{
    const enc = device.createCommandEncoder()
    const pass = enc.beginRenderPass({ colorAttachments: [{ view: tex.createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1] }] })
    pass.setPipeline(pipe)
    pass.setVertexBuffer(0, vb)
    pass.draw(3)
    pass.end()
    device.queue.submit([enc.finish()])
}
console.log('triangle via canvas ctx =', tex.readColor(50, 100).join(','))
console.log('outside =', tex.readColor(180, 100).join(','))

// 对照：直接 createTexture
const tex2 = device.createTexture({ size: [SIZE, SIZE], format: 'rgba8unorm', usage: 0x10 })
{
    const enc = device.createCommandEncoder()
    const pass = enc.beginRenderPass({ colorAttachments: [{ view: tex2.createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1] }] })
    pass.setPipeline(pipe)
    pass.setVertexBuffer(0, vb)
    pass.draw(3)
    pass.end()
    device.queue.submit([enc.finish()])
}
console.log('triangle via createTexture =', tex2.readColor(50, 100).join(','))
