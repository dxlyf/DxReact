// 二分定位：drawIndexed + 尺寸 + 格式 组合矩阵
import { gpu, Vec4, type WGSLCode } from './src/views/graphics/engine/raster/webgpu/index'
import { BufferUsage } from './src/views/graphics/engine/raster/webgpu/Buffer'

const device = await (await gpu.requestAdapter()).requestDevice()

function makePipe(attrs: { format: string; offset: number }[], stride: number): ReturnType<typeof device.createRenderPipeline> {
    const vs: WGSLCode = {
        source: 't',
        vertex(input) {
            const p = input.location(0)!
            return { position: new Vec4(p[0], p[1], 0.5, 1), varyings: [1, 0, 0, 1] }
        },
    }
    const fs: WGSLCode = { source: 'f', fragment() { return new Vec4(1, 0, 0, 1) } }
    return device.createRenderPipeline({
        vertex: {
            module: device.createShaderModule({ code: vs }),
            buffers: [{ arrayStride: stride, attributes: attrs.map((a, i) => ({ shaderLocation: i, offset: a.offset, format: a.format as never })) }],
        },
        fragment: { module: device.createShaderModule({ code: fs }), targets: [{ format: 'rgba8unorm' }] },
    })
}

async function run(size: number, indexed: boolean, useX3: boolean): Promise<string> {
    const tex = device.createTexture({ size: [size, size], format: 'rgba8unorm', usage: 0x10 })
    const stride = useX3 ? 12 : 8
    const pipe = makePipe([{ format: useX3 ? 'float32x3' : 'float32x2', offset: 0 }], stride)
    const quad = useX3
        ? new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0])
        : new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1])
    const vb = device.createBuffer({ size: 4 * stride, usage: BufferUsage.VERTEX })
    device.queue.writeBuffer(vb, 0, quad)
    const enc = device.createCommandEncoder()
    const pass = enc.beginRenderPass({ colorAttachments: [{ view: tex.createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1] }] })
    pass.setPipeline(pipe)
    pass.setVertexBuffer(0, vb)
    if (indexed) {
        const ib = device.createBuffer({ size: 6 * 2, usage: BufferUsage.INDEX })
        device.queue.writeBuffer(ib, 0, new Uint16Array([0, 1, 2, 0, 2, 3]))
        pass.setIndexBuffer(ib, 'uint16')
        pass.drawIndexed(6)
    } else {
        pass.draw(3)
    }
    pass.end()
    device.queue.submit([enc.finish()])
    const c = Math.floor(size / 2)
    return tex.readColor(c, c).join(',')
}

console.log('A draw 300 f2 :', await run(300, false, false))
console.log('B drawIdx 300 f2 :', await run(300, true, false))
console.log('C drawIdx 200 f2 :', await run(200, true, false))
console.log('D drawIdx 300 f3 :', await run(300, true, true))
console.log('E drawIdx 200 f3 :', await run(200, true, true))
