// 临时 debug：Rasterizer 用真实 clip 坐标测试（用后即删）
import { Rasterizer, type ClipVertex } from './src/views/graphics/engine/raster/cpu/Rasterizer'
import { CPUFramebuffer } from './src/views/graphics/engine/raster/cpu/Framebuffer'
import { Vec4 } from './src/views/graphics/engine/raster/cpu/math'
import type { ShaderProgram } from './src/views/graphics/engine/raster/cpu/types'

const SIZE = 300
const fb = new CPUFramebuffer(SIZE, SIZE)

const program: ShaderProgram = {
    attribs: [{ name: 'aPosition', size: 2 }],
    vertex: () => ({ position: new Vec4(0, 0, 0, 1), varyings: [1, 0, 0, 1] }),
    fragment: (input) => {
        const c = input.varyings
        return new Vec4(c[0], c[1], c[2], c[3])
    },
}

const rasterizer = new Rasterizer({
    viewport: { x: 0, y: 0, width: SIZE, height: SIZE },
    mode: 'triangles',
    cullFace: 'none',
    frontFace: 'ccw',
    depthTest: false,
    depthWrite: true,
    depthFunc: 'less',
    blend: false,
    blendFactors: { src: () => new Vec4(1, 1, 1, 1), dst: () => new Vec4(0, 0, 0, 0) },
    framebuffer: fb,
})

function drawAndScan(vertices: ClipVertex[], label: string) {
    fb.clearColor(0, 0, 0, 255)
    fb.clearDepth(1)
    rasterizer.draw(program, {}, vertices, new Uint16Array([0, 1, 2]))
    let count = 0
    let minX = 999, minY = 999, maxX = -1, maxY = -1
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const c = fb.readColor(x, y)
            if (c[0] > 100 && c[1] < 50 && c[2] < 50) {
                count++
                minX = Math.min(minX, x); maxX = Math.max(maxX, x)
                minY = Math.min(minY, y); maxY = Math.max(maxY, y)
            }
        }
    }
    console.log(`${label}: red=${count} x:[${minX},${maxX}] y:[${minY},${maxY}]`)
}

// 与 CPURenderer 单实例 offset(290,0) 相同的 clip 坐标
drawAndScan([
    { position: new Vec4(0.9333334, -1, 0, 1), varyings: [1, 0, 0, 1] },
    { position: new Vec4(1, -1, 0, 1), varyings: [1, 0, 0, 1] },
    { position: new Vec4(0.9333334, -0.9333334, 0, 1), varyings: [1, 0, 0, 1] },
], '右下角 (NDC 0.93,-1)(1,-1)(0.93,-0.93)')

// 左下角对照：与实例2 相同 clip 坐标
drawAndScan([
    { position: new Vec4(-1, -1, 0, 1), varyings: [1, 0, 0, 1] },
    { position: new Vec4(-0.9333334, -1, 0, 1), varyings: [1, 0, 0, 1] },
    { position: new Vec4(-1, -0.9333334, 0, 1), varyings: [1, 0, 0, 1] },
], '左下角 (NDC -1,-1)(-0.93,-1)(-1,-0.93)')
