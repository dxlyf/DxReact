// 单独画 line-list：无 quad 干扰，验证 line 光栅化 + depthStencil less-equal
import { gpu, Vec4, type WGSLCode } from '../packages/vue-tdesign-admin/src/views/graphics/engine/raster/webgpu/index'
import { BufferUsage } from '../packages/vue-tdesign-admin/src/views/graphics/engine/raster/webgpu/Buffer'

const device = await (await gpu.requestAdapter()).requestDevice()
const SIZE = 200

const vs: WGSLCode = {
    source: 'line',
    vertex(input) {
        const p = input.location(0)!
        return { position: new Vec4(p[0], p[1], p[2], 1), varyings: [1, 1, 1, 1] }
    },
    fragment() {
        return new Vec4(1, 1, 1, 1)
    },
}
const pipe = device.createRenderPipeline({
    vertex: { module: device.createShaderModule({ code: vs }), buffers: [{ arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }] }] },
    fragment: { module: device.createShaderModule({ code: vs }), targets: [{ format: 'rgba8unorm' }] },
    primitive: { topology: 'line-list' },
})
const lineBuf = device.createBuffer({ size: 2 * 12, usage: BufferUsage.VERTEX })
device.queue.writeBuffer(lineBuf, 0, new Float32Array([-1, 0, 0.2, 1, 0, 0.2]))

{
    const tex = device.createTexture({ size: [SIZE, SIZE], format: 'rgba8unorm', usage: 0x10 })
    const enc = device.createCommandEncoder()
    const pass = enc.beginRenderPass({ colorAttachments: [{ view: tex.createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1] }] })
    pass.setPipeline(pipe)
    pass.setVertexBuffer(0, lineBuf)
    pass.draw(2)
    pass.end()
    device.queue.submit([enc.finish()])
    console.log('line only (50,100) =', tex.readColor(50, 100).join(','), '| (50,150) =', tex.readColor(50, 150).join(','))
}
