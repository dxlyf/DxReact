// 对照：原样复刻之前通过的用例（SIZE=300, fragRed 常量, check(50,150)）
import { gpu, Vec4, type WGSLCode } from './src/views/graphics/engine/raster/webgpu/index'
import { BufferUsage } from './src/views/graphics/engine/raster/webgpu/Buffer'

const device = await (await gpu.requestAdapter()).requestDevice()
const SIZE = 300
const colorTex = device.createTexture({ size: [SIZE, SIZE], format: 'rgba8unorm', usage: 0x10 })

const triWGSL: WGSLCode = {
    source: 't',
    vertex(input) {
        const p = input.location(0)!
        return { position: new Vec4(p[0], p[1], 0.5, 1), varyings: [1, 0, 0, 1] }
    },
}
const fragRed: WGSLCode = {
    fragment() { return new Vec4(1, 0, 0, 1) },
    source: 'f',
}
const pipeline = device.createRenderPipeline({
    vertex: { module: device.createShaderModule({ code: triWGSL }), buffers: [{ arrayStride: 8, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }] }] },
    fragment: { module: device.createShaderModule({ code: fragRed }), targets: [{ format: 'rgba8unorm' }] },
})
const vertices = device.createBuffer({ size: 3 * 8, usage: BufferUsage.VERTEX })
device.queue.writeBuffer(vertices, 0, new Float32Array([-1, -1, 0, -1, -1, 1]))

const encoder = device.createCommandEncoder()
const pass = encoder.beginRenderPass({ colorAttachments: [{ view: colorTex.createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1] }] })
pass.setPipeline(pipeline)
pass.setVertexBuffer(0, vertices)
pass.draw(3)
pass.end()
device.queue.submit([encoder.finish()])

console.log('SIZE=300 const-red =', colorTex.readColor(50, 150).join(','))
