// 排查 4：常量红 fragment（不读 varyings）+ 不贴边界顶点
import { gpu, Vec4, type WGSLCode } from './src/views/graphics/engine/raster/webgpu/index'
import { BufferUsage } from './src/views/graphics/engine/raster/webgpu/Buffer'

const device = await (await gpu.requestAdapter()).requestDevice()
const SIZE = 200
const tex = device.createTexture({ size: [SIZE, SIZE], format: 'rgba8unorm', usage: 0x10 })

const vs: WGSLCode = {
    source: 't',
    vertex(input) {
        const p = input.location(0)!
        return { position: new Vec4(p[0], p[1], 0.5, 1), varyings: [1, 0, 0, 1] }
    },
}
const fs: WGSLCode = {
    source: 'f',
    fragment() { return new Vec4(1, 0, 0, 1) },
}
const pipe = device.createRenderPipeline({
    vertex: { module: device.createShaderModule({ code: vs }), buffers: [{ arrayStride: 8, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }] }] },
    fragment: { module: device.createShaderModule({ code: fs }), targets: [{ format: 'rgba8unorm' }] },
})
// 之前通过的确切顶点（右顶点 x=0，不贴边界）
const vb = device.createBuffer({ size: 3 * 8, usage: BufferUsage.VERTEX })
device.queue.writeBuffer(vb, 0, new Float32Array([-1, -1, 0, -1, -1, 1]))

{
    const enc = device.createCommandEncoder()
    const pass = enc.beginRenderPass({ colorAttachments: [{ view: tex.createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1] }] })
    pass.setPipeline(pipe)
    pass.setVertexBuffer(0, vb)
    pass.draw(3)
    pass.end()
    device.queue.submit([enc.finish()])
}
console.log('const-red tri =', tex.readColor(50, 100).join(','))
