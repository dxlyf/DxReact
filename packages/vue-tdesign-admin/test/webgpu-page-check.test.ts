// 临时验证 gpu.vue 用到的 API 组合（用后即删）
import { gpu, Vec4, type WGSLCode, type GPUCanvasContext } from './src/views/graphics/engine/raster/webgpu/index'
import { BufferUsage } from './src/views/graphics/engine/raster/webgpu/Buffer'

const device = await (await gpu.requestAdapter()).requestDevice()
const SIZE = 200

// 模拟 canvas
const fakeCanvas = {
    width: SIZE,
    height: SIZE,
    getContext: () => null,
} as unknown as HTMLCanvasElement
const gpuCtx: GPUCanvasContext = gpu.getCanvasContext(fakeCanvas)
gpuCtx.configure({ device, format: 'rgba8unorm', width: SIZE, height: SIZE })
const tex = gpuCtx.getCurrentTexture()
const depthTex = device.createTexture({ size: [SIZE, SIZE], format: 'depth32float', usage: 0x10 })

// 线框管线：line-list + less-equal + 不写深度，输出白
const wireWGSL: WGSLCode = {
    source: 'wire',
    vertex(input) {
        const p = input.location(0)!
        return { position: new Vec4(p[0], p[1], 0.5, 1), varyings: [1, 1, 1, 1] }
    },
}
const wirePipeline = device.createRenderPipeline({
    vertex: { module: device.createShaderModule({ code: wireWGSL }), buffers: [{ arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }] }] },
    fragment: { module: device.createShaderModule({ code: wireWGSL }), targets: [{ format: 'rgba8unorm' }] },
    primitive: { topology: 'line-list' },
    depthStencil: { format: 'depth32float', depthWriteEnabled: false, depthCompare: 'less-equal' },
})
// 水平线 (-1,0,0.5)→(1,0,0.5)
const lineBuf = device.createBuffer({ size: 2 * 12, usage: BufferUsage.VERTEX })
device.queue.writeBuffer(lineBuf, 0, new Float32Array([-1, 0, 0.5, 1, 0, 0.5]))

// unorm8x4 颜色立方体面管线（验证 unorm 格式读取）
const cubeWGSL: WGSLCode = {
    source: 'cube',
    vertex(input) {
        const p = input.location(0)!
        const c = input.location(1)!
        return { position: new Vec4(p[0], p[1], p[2], 1), varyings: [c[0], c[1], c[2], 1] }
    },
}
const cubePipeline = device.createRenderPipeline({
    vertex: {
        module: device.createShaderModule({ code: cubeWGSL }),
        buffers: [{ arrayStride: 16, attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x3' },
            { shaderLocation: 1, offset: 12, format: 'unorm8x4' },
        ] }],
    },
    fragment: { module: device.createShaderModule({ code: cubeWGSL }), targets: [{ format: 'rgba8unorm' }] },
    primitive: { topology: 'triangle-list', cullMode: 'back', frontFace: 'ccw' },
    depthStencil: { format: 'depth32float', depthWriteEnabled: true, depthCompare: 'less' },
})
// 一个朝向相机的面（-1..1 正方形，CCW，z=0.2）
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

// 对照：无剔除管线
const noCullPipeline = device.createRenderPipeline({
    vertex: {
        module: device.createShaderModule({ code: cubeWGSL }),
        buffers: [{ arrayStride: 16, attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x3' },
            { shaderLocation: 1, offset: 12, format: 'unorm8x4' },
        ] }],
    },
    fragment: { module: device.createShaderModule({ code: cubeWGSL }), targets: [{ format: 'rgba8unorm' }] },
    primitive: { topology: 'triangle-list' },
    depthStencil: { format: 'depth32float', depthWriteEnabled: true, depthCompare: 'less' },
})

function render() {
    const encoder = device.createCommandEncoder()
    const pass = encoder.beginRenderPass({
        colorAttachments: [{ view: tex.createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1] }],
        depthStencilAttachment: { view: depthTex.createView(), depthLoadOp: 'clear', depthStoreOp: 'store', depthClearValue: 1 },
    })
    pass.setPipeline(noCullPipeline)
    pass.setVertexBuffer(0, quadBuf)
    pass.setIndexBuffer(idxBuf, 'uint16')
    pass.drawIndexed(6)
    pass.setPipeline(cubePipeline)
    pass.setVertexBuffer(0, quadBuf)
    pass.setIndexBuffer(idxBuf, 'uint16')
    pass.drawIndexed(6)
    pass.setPipeline(wirePipeline)
    pass.setVertexBuffer(0, lineBuf)
    pass.draw(2)
    pass.end()
    device.queue.submit([encoder.finish()])
}

let pass = 0, fail = 0
const assert = (name: string, cond: boolean) => { cond ? (pass++, console.log(`PASS ${name}`)) : (fail++, console.log(`FAIL ${name}`)) }
const c = (x: number, y: number) => tex.readColor(x, y).join(',')

render()
console.log('DEBUG center =', c(100, 100), 'y=100 =', c(50, 100), 'y=30 =', c(100, 30))
// 正方形面（蓝色系 unorm）覆盖全部 → 中间应为 (60,200,255,255)
assert('unorm 颜色面', c(100, 100) === '60,200,255,255')
// 水平线 y=0 → 像素 y=100，白色覆盖 → 白
assert('line-list 白线', c(50, 100) === '255,255,255,255')
// 线外区域保持面的颜色（线不写深度，面仍在）
assert('线外仍是面', c(100, 30) === '60,200,255,255')

console.log(`\n结果: ${pass} 通过, ${fail} 失败`)
