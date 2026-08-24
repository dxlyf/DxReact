// 临时验证：实例化绘制 drawArraysInstanced / drawElementsInstanced / vertexAttribDivisor（用后即删）
import { CPURenderer, Mat4, Vec4, type VertexStageSource, type FragmentStageSource } from './src/views/graphics/engine/raster/cpu/index'

const SIZE = 300
const gl = new CPURenderer({ width: SIZE, height: SIZE })

const vertexStage: VertexStageSource = {
    attribs: [
        { name: 'aPosition', size: 2 },
        { name: 'aOffset', size: 2 },
        { name: 'aColor', size: 3 },
    ],
    uniforms: ['uTransform'],
    main(attribs, uniforms) {
        const local = attribs.getVec4('aPosition')
        const off = attribs.get('aOffset')
        const transform = (uniforms.uTransform as Mat4 | undefined) ?? Mat4.identity()
        const pos = transform.transformVec4(new Vec4(local.x + (off?.[0] ?? 0), local.y + (off?.[1] ?? 0), 0, 1))
        const color = attribs.get('aColor')
        return { position: pos, varyings: color ? [color[0], color[1], color[2], 1] : [1, 1, 1, 1] }
    },
}
const fragmentStage: FragmentStageSource = {
    main(input) {
        const c = input.varyings
        return new Vec4(c[0], c[1], c[2], c[3])
    },
}

const vs = gl.createShader(gl.VERTEX_SHADER)!
gl.shaderSource(vs, vertexStage)
gl.compileShader(vs)
const fs = gl.createShader(gl.FRAGMENT_SHADER)!
gl.shaderSource(fs, fragmentStage)
gl.compileShader(fs)
const program = gl.createProgram()
gl.attachShader(program, vs)
gl.attachShader(program, fs)
gl.linkProgram(program)
gl.useProgram(program)
const aPos = gl.getAttribLocation(program, 'aPosition')
const aOffset = gl.getAttribLocation(program, 'aOffset')
const aColor = gl.getAttribLocation(program, 'aColor')
const uTransform = gl.getUniformLocation(program, 'uTransform')

// 60x60 大三角形，便于采样
const tri = new Float32Array([0, 0, 60, 0, 0, 60])
const offsets = new Float32Array([0, 0, 120, 120, 240, 0])
const colors = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])

const vao = gl.createVertexArray()
gl.bindVertexArray(vao)
const triBuf = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, triBuf)
gl.bufferData(gl.ARRAY_BUFFER, tri, gl.STATIC_DRAW)
gl.enableVertexAttribArray(aPos)
gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
const offBuf = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, offBuf)
gl.bufferData(gl.ARRAY_BUFFER, offsets, gl.STATIC_DRAW)
gl.enableVertexAttribArray(aOffset)
gl.vertexAttribPointer(aOffset, 2, gl.FLOAT, false, 0, 0)
gl.vertexAttribDivisor(aOffset, 1)
const colorBuf = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuf)
gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW)
gl.enableVertexAttribArray(aColor)
gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0)
gl.vertexAttribDivisor(aColor, 1)

const ib = gl.createBuffer()
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib)
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2]), gl.STATIC_DRAW)

let failed = 0
function assert(cond: boolean, msg: string) {
    if (!cond) { console.error(`FAIL: ${msg}`); failed++ } else console.log(`ok: ${msg}`)
}

/** 检查以 (cx, cy) 为中心(左下原点)的 20x20 区域内是否存在指定颜色 */
function regionHas(cx: number, cy: number, rgb: [number, number, number]): boolean {
    for (let dy = -8; dy <= 8; dy++) {
        for (let dx = -8; dx <= 8; dx++) {
            const p = new Uint8Array(4)
            gl.readPixels(cx + dx, cy + dy, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, p)
            if (Math.abs(p[0] - rgb[0]) <= 10 && Math.abs(p[1] - rgb[1]) <= 10 && Math.abs(p[2] - rgb[2]) <= 10) return true
        }
    }
    return false
}

const ortho = Mat4.ortho(0, SIZE, 0, SIZE, -1, 1)
gl.uniformMatrix4fv(uTransform, false, ortho.m)
gl.clearColor(0, 0, 0, 1)

// ---- 1. drawArraysInstanced（3 实例）----
gl.clear(gl.COLOR_BUFFER_BIT)
gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, 3)
// 世界 (30,30) → NDC → 内部 (30, 270) → readPixels (30, 29)
assert(regionHas(30, 29, [255, 0, 0]), '实例0 红 @左下 (30,29)')
assert(regionHas(150, 149, [0, 255, 0]), '实例1 绿 @中 (150,149)')
assert(regionHas(270, 29, [0, 0, 255]), '实例2 蓝 @右下 (270,29)')
// 空白区背景
const bg = new Uint8Array(4)
gl.readPixels(75, 75, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, bg)
assert(bg.join(',') === '0,0,0,255', `无实例区域为背景 (${bg.join(',')})`)

// ---- 2. drawElementsInstanced ----
gl.clear(gl.COLOR_BUFFER_BIT)
gl.drawElementsInstanced(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0, 3)
assert(regionHas(30, 29, [255, 0, 0]), 'drawElementsInstanced 实例0 红')
assert(regionHas(150, 149, [0, 255, 0]), 'drawElementsInstanced 实例1 绿')
assert(regionHas(270, 29, [0, 0, 255]), 'drawElementsInstanced 实例2 蓝')

// ---- 3. divisor=2：实例0/1 用偏移[0,0]，实例2/3 用偏移[120,120] ----
const offBuf2 = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, offBuf2)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 120, 120]), gl.STATIC_DRAW)
gl.enableVertexAttribArray(aOffset)
gl.vertexAttribPointer(aOffset, 2, gl.FLOAT, false, 0, 0)
gl.vertexAttribDivisor(aOffset, 2)
gl.clear(gl.COLOR_BUFFER_BIT)
gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, 4) // 4 个实例
// 实例0(红)/实例1(绿) 同位置左下，绿覆盖
assert(regionHas(30, 29, [0, 255, 0]), 'divisor=2 实例0/1 左下，实例1绿覆盖')
// 实例2(蓝)/实例3(白，颜色越界→默认白) 在偏移(120,120)，白覆盖
assert(regionHas(150, 149, [255, 255, 255]), 'divisor=2 实例2/3 偏移(120,120)，实例3白覆盖')
// 中间区域背景
const bg2 = new Uint8Array(4)
gl.readPixels(30, 149, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, bg2)
assert(bg2.join(',') === '0,0,0,255', `divisor=2 空白区为背景 (${bg2.join(',')})`)

console.log(failed === 0 ? 'ALL PASS' : `${failed} FAILED`)
