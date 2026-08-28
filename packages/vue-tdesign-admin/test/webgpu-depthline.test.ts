// 实验：quad 写深度 0.2 后，再画 z=0.2 的 line（depthStencil less-equal）是否显示
import { gpu, Vec4, type WGSLCode } from '../packages/vue-tdesign-admin/src/views/graphics/engine/raster/webgpu/index'
import { BufferUsage } from '../packages/vue-tdesign-admin/src/views/graphics/engine/raster/webgpu/Buffer'

const device = await (await gpu.requestAdapter()).requestDevice()
const SIZE = 200
const tex = device.createTexture({ size: [SIZE, SIZE], format: 'rgba8unorm', usage: 0x10 })
const depthTex = device.createTexture({ size: [SIZE, SIZE], format: 'depth32float', usage: 0x10 })

const quadWGSL: WGSLCode = {
    source: 'quad',
    vertex(input) {
        const p = input.location(0)!
        return { position: new Vec4(p[0], p[1], p[2], 1), varyings: [0.3, 0.8, 1, 1] }
    },
    fragment(input) {
        const v = input.varyings
        return new Vec4(v[0], v[1], v[2], 1)
    },
}
const quadPipe = device.createRenderPipeline({
    vertex: { module: device.createShaderModule({ code: quadWGSL }), buffers: [{ arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }] }] },
    fragment: { module: device.createShaderModule({ code: quadWGSL }), targets: [{ format: 'rgba8unorm' }] },
    depthStencil: { format: 'depth32float', depthWriteEnabled: true, depthCompare: 'less' },
})
const wireWGSL: WGSLCode = {
    source: 'wire',
    vertex(input) {
        const p = input.location(0)!
        return { position: new Vec4(p[0], p[1], p[2], 1), varyings: [1, 1, 1, 1] }
    },
    fragment() {
        return new Vec4(1, 1, 1, 1)
    },
}
const wirePipe = device.createRenderPipeline({
    vertex: { module: device.createShaderModule({ code: wireWGSL }), buffers: [{ arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }] }] },
    fragment: { module: device.createShaderModule({ code: wireWGSL }), targets: [{ format: 'rgba8unorm' }] },
    primitive: { topology: 'line-list' },
    depthStencil: { format: 'depth32float', depthWriteEnabled: false, depthCompare: 'less-equal' },
})
const quadBuf = device.createBuffer({ size: 4 * 12, usage: BufferUsage.VERTEX })
device.queue.writeBuffer(quadBuf, 0, new Float32Array([-1, -1, 0.2, 1, -1, 0.2, 1, 1, 0.2, -1, 1, 0.2]))
const idxBuf = device.createBuffer({ size: 6 * 2, usage: BufferUsage.INDEX })
device.queue.writeBuffer(idxBuf, 0, new Uint16Array([0, 1, 2, 0, 2, 3]))
const lineBuf = device.createBuffer({ size: 2 * 12, usage: BufferUsage.VERTEX })
device.queue.writeBuffer(lineBuf, 0, new Float32Array([-1, 0, 0.2, 1, 0, 0.2]))

function render(drawQuad: boolean, drawWire: boolean): void {
    const enc = device.createCommandEncoder()
    const pass = enc.beginRenderPass({
        colorAttachments: [{ view: tex.createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1] }],
        depthStencilAttachment: { view: depthTex.createView(), depthLoadOp: 'clear', depthStoreOp: 'store', depthClearValue: 1 },
    })
    if (drawQuad) {
        pass.setPipeline(quadPipe)
        pass.setVertexBuffer(0, quadBuf)
        pass.setIndexBuffer(idxBuf, 'uint16')
        pass.drawIndexed(6)
    }
    if (drawWire) {
        pass.setPipeline(wirePipe)
        pass.setVertexBuffer(0, lineBuf)
        pass.draw(2)
    }
    pass.end()
    device.queue.submit([enc.finish()])
}

render(true, false)
console.log('quad only (50,100) =', tex.readColor(50, 100).join(','))
render(true, true)
console.log('quad+wire (50,100) =', tex.readColor(50, 100).join(','))
console.log('quad+wire (50,150) =', tex.readColor(50, 150).join(','))
