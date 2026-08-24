// 决定性测试：cullMode 'back' + frontFace 'ccw' 是否误剔除（页面用到的组合）
import { gpu, Vec4, type WGSLCode } from '../src/views/graphics/engine/raster/webgpu/index'
import { BufferUsage } from '../src/views/graphics/engine/raster/webgpu/Buffer'

const device = await (await gpu.requestAdapter()).requestDevice()
const SIZE = 200

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

async function run(cull: 'none' | 'back' | 'front'): Promise<string> {
    const tex = device.createTexture({ size: [SIZE, SIZE], format: 'rgba8unorm', usage: 0x10 })
    const pipe = device.createRenderPipeline({
        vertex: {
            module: device.createShaderModule({ code: cubeWGSL }),
            buffers: [{ arrayStride: 16, attributes: [
                { shaderLocation: 0, offset: 0, format: 'float32x3' },
                { shaderLocation: 1, offset: 12, format: 'unorm8x4' },
            ] }],
        },
        fragment: { module: device.createShaderModule({ code: cubeWGSL }), targets: [{ format: 'rgba8unorm' }] },
        primitive: { topology: 'triangle-list', cullMode: cull, frontFace: 'ccw' },
    })
    const vb = device.createBuffer({ size: quad.byteLength, usage: BufferUsage.VERTEX })
    device.queue.writeBuffer(vb, 0, quad)
    const ib = device.createBuffer({ size: 6 * 2, usage: BufferUsage.INDEX })
    device.queue.writeBuffer(ib, 0, new Uint16Array([0, 1, 2, 0, 2, 3]))
    const enc = device.createCommandEncoder()
    const pass = enc.beginRenderPass({ colorAttachments: [{ view: tex.createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1] }] })
    pass.setPipeline(pipe)
    pass.setVertexBuffer(0, vb)
    pass.setIndexBuffer(ib, 'uint16')
    pass.drawIndexed(6)
    pass.end()
    device.queue.submit([enc.finish()])
    return tex.readColor(100, 100).join(',')
}

console.log('cull=none   :', await run('none'))
console.log('cull=back   :', await run('back'))
console.log('cull=front  :', await run('front'))
