// 临时验证：实例化绘制（用后即删）。全部用 fb.readColor 内部坐标（左上原点）
import { CPURenderer, Mat4, Vec4, type VertexStageSource, type FragmentStageSource } from './src/views/graphics/engine/raster/cpu/index'

const gl = new CPURenderer({ width: 300, height: 300 })

const vs: VertexStageSource = {
    attribs: [
        { name: 'aPosition', size: 2 },
        { name: 'aOffset', size: 2 },
        { name: 'aColor', size: 4 },
    ],
    uniforms: ['uTransform'],
    main(attribs, uniforms) {
        const p = attribs.getVec4('aPosition')
        const off = attribs.get('aOffset') ?? new Float32Array([0, 0])
        const color = attribs.get('aColor') ?? new Float32Array([1, 1, 1, 1])
        const pos = (uniforms.uTransform as Mat4).transformVec4(new Vec4(p.x + off[0], p.y + off[1], 0, 1))
        return { position: pos, varyings: [color[0], color[1], color[2], color[3]] }
    },
}
const fs: FragmentStageSource = {
    main(input) {
        const c = input.varyings
        return new Vec4(c[0], c[1], c[2], c[3])
    },
}

const shv = gl.createShader(gl.VERTEX_SHADER)!
gl.shaderSource(shv, vs)
gl.compileShader(shv)
const shf = gl.createShader(gl.FRAGMENT_SHADER)!
gl.shaderSource(shf, fs)
gl.compileShader(shf)
const program = gl.createProgram()
gl.attachShader(program, shv)
gl.attachShader(program, shf)
gl.linkProgram(program)
gl.useProgram(program)
const aPos = gl.getAttribLocation(program, 'aPosition')
const aOff = gl.getAttribLocation(program, 'aOffset')
const aColor = gl.getAttribLocation(program, 'aColor')
const uTrans = gl.getUniformLocation(program, 'uTransform')

const ortho = Mat4.ortho(0, 300, 0, 300, -1, 1)
gl.uniformMatrix4fv(uTrans, false, ortho.m)

// 三角形 (0,0)(10,0)(0,10) + 3 组 offset/color
const verts = new Float32Array([0, 0, 10, 0, 0, 10])
const offsets = new Float32Array([0, 0, 145, 145, 290, 0])
const colors = new Float32Array([1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1])
const indices = new Uint16Array([0, 1, 2])

const vao = gl.createVertexArray()
gl.bindVertexArray(vao)
const vbo = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW)
gl.enableVertexAttribArray(aPos)
gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
const offBuf = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, offBuf)
gl.bufferData(gl.ARRAY_BUFFER, offsets, gl.STATIC_DRAW)
gl.enableVertexAttribArray(aOff)
gl.vertexAttribPointer(aOff, 2, gl.FLOAT, false, 0, 0)
gl.vertexAttribDivisor(aOff, 1)
const colBuf = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, colBuf)
gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW)
gl.enableVertexAttribArray(aColor)
gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0)
gl.vertexAttribDivisor(aColor, 1)
const ebo = gl.createBuffer()
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo)
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

gl.clearColor(0, 0, 0, 1)
gl.clear(gl.COLOR_BUFFER_BIT)

const fb = gl.defaultFramebuffer
function count(color: (c: number[]) => boolean): { n: number; minX: number; maxX: number; minY: number; maxY: number } {
    let n = 0
    let minX = 999, maxX = -1, minY = 999, maxY = -1
    for (let y = 0; y < 300; y++) {
        for (let x = 0; x < 300; x++) {
            const c = fb.readColor(x, y)
            if (color(c)) {
                n++
                minX = Math.min(minX, x); maxX = Math.max(maxX, x)
                minY = Math.min(minY, y); maxY = Math.max(maxY, y)
            }
        }
    }
    return { n, minX, maxX, minY, maxY }
}
const isRed = (c: number[]) => c[0] > 100 && c[1] < 50 && c[2] < 50
const isGreen = (c: number[]) => c[1] > 100 && c[0] < 50 && c[2] < 50
const isBlue = (c: number[]) => c[2] > 100 && c[0] < 50 && c[1] < 50

// ---------- 1. drawArraysInstanced：3 实例 ----------
gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, 3)
console.log('drawArraysInstanced err:', gl.getError())
console.log('红 count:', JSON.stringify(count(isRed)), 'sample(3,297):', fb.readColor(3, 297).join(','))
console.log('绿 count:', JSON.stringify(count(isGreen)), 'sample(148,152):', fb.readColor(148, 152).join(','))
console.log('蓝 count:', JSON.stringify(count(isBlue)), 'sample(293,297):', fb.readColor(293, 297).join(','))
let pass = 0, fail = 0
function assert(name: string, cond: boolean) {
    if (cond) { pass++; console.log(`PASS ${name}`) } else { fail++; console.log(`FAIL ${name}`) }
}
assert('实例化 红≈55', count(isRed).n >= 40)
assert('实例化 绿≈55', count(isGreen).n >= 40)
assert('实例化 蓝≈55', count(isBlue).n >= 40)
assert('实例化 红位置', fb.readColor(3, 297)[0] > 200)
assert('实例化 绿位置', fb.readColor(148, 152)[1] > 200)
assert('实例化 蓝位置', fb.readColor(293, 297)[2] > 200)

// ---------- 2. drawElementsInstanced ----------
gl.clear(gl.COLOR_BUFFER_BIT)
gl.drawElementsInstanced(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0, 3)
console.log('drawElementsInstanced err:', gl.getError())
console.log('E 红:', JSON.stringify(count(isRed)), 'sample(3,297):', fb.readColor(3, 297).join(','))
console.log('E 绿:', JSON.stringify(count(isGreen)), 'sample(148,152):', fb.readColor(148, 152).join(','))
console.log('E 蓝:', JSON.stringify(count(isBlue)), 'sample(293,297):', fb.readColor(293, 297).join(','))
assert('Elements 红位置', fb.readColor(3, 297)[0] > 200)
assert('Elements 绿位置', fb.readColor(148, 152)[1] > 200)
assert('Elements 蓝位置', fb.readColor(293, 297)[2] > 200)

// ---------- 3. divisor=2：实例 0/1 共享 offset0+红，实例 2/3 共享 offset1+绿 ----------
const offBuf2 = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, offBuf2)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 145, 145]), gl.STATIC_DRAW)
gl.enableVertexAttribArray(aOff)
gl.vertexAttribPointer(aOff, 2, gl.FLOAT, false, 0, 0)
gl.vertexAttribDivisor(aOff, 2)
const colBuf2 = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, colBuf2)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 0, 0, 1, 0, 1, 0, 1]), gl.STATIC_DRAW)
gl.enableVertexAttribArray(aColor)
gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0)
gl.vertexAttribDivisor(aColor, 2)
gl.clear(gl.COLOR_BUFFER_BIT)
gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, 4)
console.log('divisor=2 err:', gl.getError())
const r = count(isRed)
const g = count(isGreen)
console.log('divisor=2 红 count:', JSON.stringify(r), 'sample(3,297):', fb.readColor(3, 297).join(','))
console.log('divisor=2 绿 count:', JSON.stringify(g), 'sample(148,152):', fb.readColor(148, 152).join(','))
console.log('divisor=2 蓝 count:', count(isBlue).n)
assert('divisor=2 红位置', fb.readColor(3, 297)[0] > 200)
assert('divisor=2 绿位置', fb.readColor(148, 152)[1] > 200)
assert('divisor=2 无蓝', count(isBlue).n === 0)
console.log(`\n结果: ${pass} 通过, ${fail} 失败`)
