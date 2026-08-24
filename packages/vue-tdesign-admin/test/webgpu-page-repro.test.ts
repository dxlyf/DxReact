// 复刻 gpu.vue 页面场景：同一 pass 内 3 个 pipeline（noCull quad → cull quad → line-list wire）
import { gpu, Vec4, type WGSLCode, type GPUCanvasContext } from '../src/views/graphics/engine/raster/webgpu/index'
import { BufferUsage } from '../src/views/graphics/engine/raster/webgpu/Buffer'

const device = await (await gpu.requestAdapter()).requestDevice()
const SIZE = 200

const fakeCanvas = { width: SIZE, height: SIZE, getContext: () => null } as unknown as HTMLCanvasElement
const gpuCtx: GPUCanvasContext = gpu.getCanvasContext(fakeCanvas)
gpuCtx.configure({ device, format: 'rgba8unorm', width: SIZE, height: SIZE })
const tex = gpuCtx.getCurrentTexture()
const depthTex = device.createTexture({ size: [SIZE, SIZE], format: 'depth32float', usage: 0x10 })

const cubeWGSL: WGSLCode = {
    source: 'cube',
    vertex(input) {
        const p = input.location(0)!
        const c = input.location(1)!
        return { position: new Vec4(p[0], p[1], p[2], 1), varyings: [c[0], c[1], c[2], 1] }
    },
    fragment(input) {
        const v = input.varyings
        return new Vec4(v[0], v[1], v[2], 1)
    },
}
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

function makeCubePipeline(cullMode: 'none' | 'back') {
    return device.createRenderPipeline({
        vertex: {
            module: device.createShaderModule({ code: cubeWGSL }),
            buffers: [{ arrayStride: 16, attributes: [
                { shaderLocation: 0, offset: 0, format: 'float32x3' },
                { shaderLocation: 1, offset: 12, format: 'unorm8x4' },
            ] }],
        },
        fragment: { module: device.createShaderModule({ code: cubeWGSL }), targets: [{ format: 'rgba8unorm' }] },
        primitive: { topology: 'triangle-list', cullMode, frontFace: 'ccw' },
        depthStencil: { format: 'depth32float', depthWriteEnabled: true, depthCompare: 'less' },
    })
}
const noCull = makeCubePipeline('none')
const withCull = makeCubePipeline('back')

const wirePipeline = device.createRenderPipeline({
    vertex: { module: device.createShaderModule({ code: wireWGSL }), buffers: [{ arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }] }] },
    fragment: { module: device.createShaderModule({ code: wireWGSL }), targets: [{ format: 'rgba8unorm' }] },
    primitive: { topology: 'line-list' },
    depthStencil: { format: 'depth32float', depthWriteEnabled: false, depthCompare: 'less-equal' },
})

const quad = new ArrayBuffer(4 * 16)
{
    const dv = new DataView(quad)
    const vs: [number, number, number][] = [[-1, -1, 0.2], [1, -1, 0.2], [1, 1, 0.2], [-1, 1, 0.2]]
    const col = [60, 200, 255]
    vs.forEach(([x, y, z], i) => {
        const o = i * 16
        dv.setFloat32(o, x, true); dv.setFloat32(o + 4, y, true); dv.setFloat32(o + 8, z, true)
        dv.setUint8(o + 12, col[0]); dv.setUint8(o + 13, col[1]); dv.setUint8(o + 14, col[2]); dv.setUint8(o + 15, 255)
    })
}
const quadBuf = device.createBuffer({ size: quad.byteLength, usage: BufferUsage.VERTEX })
device.queue.writeBuffer(quadBuf, 0, quad)
const idxBuf = device.createBuffer({ size: 6 * 2, usage: BufferUsage.INDEX })
device.queue.writeBuffer(idxBuf, 0, new Uint16Array([0, 1, 2, 0, 2, 3]))
const lineBuf = device.createBuffer({ size: 2 * 12, usage: BufferUsage.VERTEX })
device.queue.writeBuffer(lineBuf, 0, new Float32Array([-1, 0, 0.2, 1, 0, 0.2])) // 与 quad 共面 z=0.2

{
    const enc = device.createCommandEncoder()
    const pass = enc.beginRenderPass({
        colorAttachments: [{ view: tex.createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1] }],
        depthStencilAttachment: { view: depthTex.createView(), depthLoadOp: 'clear', depthStoreOp: 'store', depthClearValue: 1 },
    })
    pass.setPipeline(noCull)
    pass.setVertexBuffer(0, quadBuf)
    pass.setIndexBuffer(idxBuf, 'uint16')
    pass.drawIndexed(6)
    pass.setPipeline(withCull)
    pass.setVertexBuffer(0, quadBuf)
    pass.setIndexBuffer(idxBuf, 'uint16')
    pass.drawIndexed(6)
    pass.setPipeline(wirePipeline)
    pass.setVertexBuffer(0, lineBuf)
    pass.draw(2)
    pass.end()
    device.queue.submit([enc.finish()])
}

console.log('center =', tex.readColor(100, 100).join(','))
console.log('line y=100 =', tex.readColor(50, 100).join(','))
console.log('offline y=30 =', tex.readColor(100, 30).join(','))
