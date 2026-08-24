// 临时验证：Scissor 裁剪测试（用后即删）
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

// 大三角形：覆盖整个屏幕 (0,0)(300,0)(0,300)，红色
const verts = new Float32Array([0, 0, 1, 0, 0, 1, 300, 0, 1, 0, 0, 1, 0, 300, 1, 0, 0, 1])
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
const c = (x: number, y: number) => fb.readColor(x, y).join(',')
const isRed = (x: number, y: number) => c(x, y) === '255,0,0,255'
const isBg = (x: number, y: number) => c(x, y) === '0,0,0,255'

let pass = 0, fail = 0
function assert(name: string, cond: boolean) {
    if (cond) { pass++; console.log(`PASS ${name}`) } else { fail++; console.log(`FAIL ${name}`) }
}

gl.disable(gl.DEPTH_TEST)

// ---------- 1. 无 scissor：三角形全屏 ----------
gl.clearColor(0, 0, 0, 1)
gl.clear(gl.COLOR_BUFFER_BIT)
gl.drawArrays(gl.TRIANGLES, 0, 3)
assert('无scissor 左上红', isRed(10, 10))
assert('无scissor 右下红', isRed(290, 290))

// ---------- 2. 启用 scissor：只画左上半区（WebGL 左下原点: x=0,y=150,w=300,h=150 → 内部 y 0..150）----------
gl.clear(gl.COLOR_BUFFER_BIT)
gl.enable(gl.SCISSOR_TEST)
gl.scissor(0, 150, 300, 150) // 屏幕上半（内部 y∈[0,150)）
gl.drawArrays(gl.TRIANGLES, 0, 3)
assert('scissor 内部上部红', isRed(10, 10))
assert('scissor 内部下部背景', isBg(10, 290))

// ---------- 3. 右下角小框：x=200,y=0,w=100,h=100 → 内部 x∈[200,300), y∈[200,300) ----------
gl.clear(gl.COLOR_BUFFER_BIT)
gl.scissor(200, 0, 100, 100)
gl.drawArrays(gl.TRIANGLES, 0, 3)
assert('小框 内部右下红', isRed(250, 250))
assert('小框 内部左上背景', isBg(10, 10))
assert('小框 框外(x越界)背景', isBg(150, 250)) // x=150 不在 [200,300)
assert('小框 框外(y越界)背景', isBg(290, 150)) // y=150 不在 [200,300)

// ---------- 4. 关闭 scissor 恢复全屏 ----------
gl.disable(gl.SCISSOR_TEST)
gl.clear(gl.COLOR_BUFFER_BIT)
gl.drawArrays(gl.TRIANGLES, 0, 3)
assert('关闭后 右下红', isRed(290, 290))

// ---------- 5. scissor 影响 clear：只清除区域内（内部 x∈[0,100), y∈[200,300)）----------
gl.disable(gl.SCISSOR_TEST)
gl.clearColor(0, 0, 0, 1)
gl.clear(gl.COLOR_BUFFER_BIT)
gl.drawArrays(gl.TRIANGLES, 0, 3) // 全屏红
gl.enable(gl.SCISSOR_TEST)
gl.scissor(0, 0, 100, 100)
gl.clear(gl.COLOR_BUFFER_BIT) // scissor 清除
assert('clear-scissor 区域内背景', isBg(50, 250))
assert('clear-scissor 区域外仍红', isRed(50, 100))

// ---------- 6. 负宽高报错 ----------
gl.scissor(0, 0, -1, 10)
assert('负宽 INVALID_VALUE', gl.getError() === gl.INVALID_VALUE)

// ---------- 7. 非法 cap 报错 ----------
gl.enable(0xffff)
assert('非法cap INVALID_ENUM', gl.getError() === gl.INVALID_ENUM)

gl.disable(gl.SCISSOR_TEST)
console.log(`\n结果: ${pass} 通过, ${fail} 失败`)
