// 临时验证：模板缓冲与模板测试（用后即删）
import { CPURenderer, Mat4, Vec4, type VertexStageSource, type FragmentStageSource } from './src/views/graphics/engine/raster/cpu/index'

const gl = new CPURenderer({ width: 300, height: 300 })

const vs: VertexStageSource = {
    attribs: [
        { name: 'aPosition', size: 2 },
        { name: 'aColor', size: 4 },
    ],
    uniforms: ['uTransform'],
    main(attribs, uniforms) {
        const p = attribs.getVec4('aPosition')
        const color = attribs.get('aColor')!
        const pos = (uniforms.uTransform as Mat4).transformVec4(p)
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
const aColor = gl.getAttribLocation(program, 'aColor')
gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uTransform'), false, Mat4.ortho(0, 300, 0, 300, -1, 1).m)

// tri1 红 (100,100)(200,100)(100,200) + tri2 绿 (50,50)(250,50)(50,250)，同一缓冲
const verts = new Float32Array([
    100, 100, 1, 0, 0, 1,
    200, 100, 1, 0, 0, 1,
    100, 200, 1, 0, 0, 1,
    50, 50, 0, 1, 0, 1,
    250, 50, 0, 1, 0, 1,
    50, 250, 0, 1, 0, 1,
])
const vao = gl.createVertexArray()
gl.bindVertexArray(vao)
const vbo = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW)
gl.enableVertexAttribArray(aPos)
gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 24, 0)
gl.enableVertexAttribArray(aColor)
gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 24, 8)

const fb = gl.defaultFramebuffer
const s = (x: number, y: number) => fb.readStencil(x, y)
const c = (x: number, y: number) => fb.readColor(x, y).join(',')
const isBlack = (x: number, y: number) => c(x, y) === '0,0,0,255'
const isRed = (x: number, y: number) => c(x, y) === '255,0,0,255'
const isGreen = (x: number, y: number) => c(x, y) === '0,255,0,255'

let pass = 0, fail = 0
function assert(name: string, cond: boolean) {
    if (cond) { pass++; console.log(`PASS ${name}`) } else { fail++; console.log(`FAIL ${name}`) }
}

// ---------- 1. 模板写入：ALWAYS + REPLACE ref=7 ----------
gl.disable(gl.DEPTH_TEST)
gl.enable(gl.STENCIL_TEST)
gl.stencilMask(0xff)
gl.stencilFunc(gl.ALWAYS, 7, 0xff)
gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE)
gl.clearColor(0, 0, 0, 1)
gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)
gl.drawArrays(gl.TRIANGLES, 0, 3)
console.log('err(1):', gl.getError())
assert('写入 内部=7', s(150, 150) === 7)
assert('写入 外部=0', s(10, 10) === 0)
assert('写入 颜色仍红', isRed(150, 150))

// ---------- 2. 模板门控：EQUAL(7) 只画在模板区域 ----------
gl.stencilFunc(gl.EQUAL, 7, 0xff)
gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP)
gl.drawArrays(gl.TRIANGLES, 3, 3) // 绿色大三角形
assert('门控 重叠区=绿', isGreen(150, 150))
assert('门控 大三角内部但模板0=黑', isBlack(70, 70))
assert('门控 模板仍为7', s(150, 150) === 7)
assert('门控 外部黑', isBlack(10, 10))

// ---------- 3. fail 操作：NEVER(全失败) + opFail=INCR ----------
gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)
gl.stencilFunc(gl.NEVER, 0, 0xff)
gl.stencilOp(gl.INCR, gl.INCR, gl.INCR)
gl.drawArrays(gl.TRIANGLES, 0, 3)
console.log('err(3):', gl.getError())
assert('fail=INCR 内部=1', s(150, 150) === 1)
assert('fail=INCR 外部=0', s(10, 10) === 0)
assert('fail 颜色未写入=黑', isBlack(150, 150))

// ---------- 4. zfail 操作：深度全失败 + opZFail=INCR，颜色不写 ----------
gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
gl.enable(gl.DEPTH_TEST)
gl.depthFunc(gl.NEVER) // 所有深度测试失败
gl.stencilFunc(gl.ALWAYS, 0, 0xff)
gl.stencilOp(gl.KEEP, gl.INCR, gl.KEEP)
gl.drawArrays(gl.TRIANGLES, 0, 3)
assert('zfail=INCR 内部=1', s(150, 150) === 1)
assert('zfail 颜色未写入=黑', isBlack(150, 150))
gl.disable(gl.DEPTH_TEST)
gl.depthFunc(gl.LESS)

// ---------- 5. writeMask：只写低 4 位 ----------
gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)
gl.stencilMask(0x0f)
gl.stencilFunc(gl.ALWAYS, 0xff, 0xff)
gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE)
gl.drawArrays(gl.TRIANGLES, 0, 3)
assert('writeMask 内部=15(0x0f)', s(150, 150) === 15)

// ---------- 6. INCR 继续递增 ----------
gl.stencilMask(0xff)
gl.stencilFunc(gl.ALWAYS, 0, 0xff)
gl.stencilOp(gl.INCR, gl.INCR, gl.INCR)
gl.drawArrays(gl.TRIANGLES, 0, 3)
assert('INCR 16', s(150, 150) === 16)
gl.drawArrays(gl.TRIANGLES, 0, 3)
assert('INCR 17', s(150, 150) === 17)

// ---------- 7. INVERT / ZERO ----------
gl.stencilFunc(gl.ALWAYS, 0, 0xff)
gl.stencilOp(gl.INVERT, gl.INVERT, gl.INVERT)
gl.drawArrays(gl.TRIANGLES, 0, 3)
assert('INVERT 17→238', s(150, 150) === (~17 & 0xff))
gl.stencilOp(gl.ZERO, gl.ZERO, gl.ZERO)
gl.drawArrays(gl.TRIANGLES, 0, 3)
assert('ZERO 0', s(150, 150) === 0)
gl.disable(gl.STENCIL_TEST)

// ---------- 8. 关闭模板测试后正常绘制 ----------
gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)
gl.drawArrays(gl.TRIANGLES, 0, 3)
assert('关闭后 颜色红', isRed(150, 150))

console.log(`\n结果: ${pass} 通过, ${fail} 失败`)
