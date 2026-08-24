// 临时冒烟测试：验证 WebGL 风格 CPU 渲染器（用后即删）
import { CPURenderer, colorVertexStage, colorFragmentStage, Mat4 } from './src/views/graphics/engine/raster/cpu/index'

let failed = 0
function assert(cond: boolean, msg: string): void {
    if (!cond) {
        console.error(`FAIL: ${msg}`)
        failed++
    } else {
        console.log(`ok: ${msg}`)
    }
}

// 交错顶点布局：pos(2) + color(4)，每顶点 6 floats = 24 字节（WebGL 必须显式给 stride）
const VERTEX_STRIDE = 24
const COLOR_OFFSET = 8

// ---- 构建 WebGL 风格环境 ----
const gl = new CPURenderer({ width: 100, height: 100 })

const vs = gl.createShader(gl.VERTEX_SHADER)!
gl.shaderSource(vs, colorVertexStage)
gl.compileShader(vs)
assert(gl.getShaderParameter(vs, gl.COMPILE_STATUS) === true, 'vertex shader compiled')

const fs = gl.createShader(gl.FRAGMENT_SHADER)!
gl.shaderSource(fs, colorFragmentStage)
gl.compileShader(fs)
assert(gl.getShaderParameter(fs, gl.COMPILE_STATUS) === true, 'fragment shader compiled')

const program = gl.createProgram()
gl.attachShader(program, vs)
gl.attachShader(program, fs)
gl.linkProgram(program)
assert(gl.getProgramParameter(program, gl.LINK_STATUS) === true, 'program linked')
gl.useProgram(program)

gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uProjection')!, false, Mat4.ortho(0, 100, 0, 100, -1, 1).m)
gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uTransform')!, false, Mat4.identity().m)

const aPos = gl.getAttribLocation(program, 'aPosition')
const aColor = gl.getAttribLocation(program, 'aColor')
assert(aPos === 0 && aColor === 1, 'getAttribLocation 按声明顺序返回索引')

/** 复用：创建绑定指定数据的 VAO 并配置 attribute */
function makeVAO(data: number[]): void {
    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)
    const vbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, VERTEX_STRIDE, 0)
    gl.enableVertexAttribArray(aColor)
    gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, VERTEX_STRIDE, COLOR_OFFSET)
}

gl.clearColor(0, 0, 0, 1)
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

// ---- 1. 底部半个视口红 ----
makeVAO([
    0, 0, 1, 0, 0, 1,
    100, 0, 1, 0, 0, 1,
    100, 50, 1, 0, 0, 1,
    0, 0, 1, 0, 0, 1,
    100, 50, 1, 0, 0, 1,
    0, 50, 1, 0, 0, 1,
])
gl.drawArrays(gl.TRIANGLES, 0, 6)

// readPixels：左下原点（WebGL），底部行应红、顶部行应黑
const bottom = new Uint8Array(4)
const top = new Uint8Array(4)
gl.readPixels(50, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, bottom)
gl.readPixels(50, 99, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, top)
assert(bottom.join(',') === '255,0,0,255', `readPixels 底部行红色 (${bottom.join(',')})`)
assert(top.join(',') === '0,0,0,255', `readPixels 顶部行黑色 (${top.join(',')})`)

// ---- 2. 深度测试（蓝 z=-0.5 -> 深度 0.25 更近）----
gl.enable(gl.DEPTH_TEST)
gl.clearDepth(1)
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
makeVAO([
    0, 0, 1, 0, 0, 1,
    100, 0, 1, 0, 0, 1,
    100, 100, 1, 0, 0, 1,
    0, 0, 1, 0, 0, 1,
    100, 100, 1, 0, 0, 1,
    0, 100, 1, 0, 0, 1,
])
gl.drawArrays(gl.TRIANGLES, 0, 6) // 红底（深度 0.5）

makeVAO([
    0, 0, 0, 0, 1, 1,
    50, 0, 0, 0, 1, 1,
    50, 100, 0, 0, 1, 1,
])
// ortho(near=-1,far=1) 下 ndc.z = -world.z，z=+0.5 -> 深度 0.25 更近
gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uTransform')!, false, Mat4.translation(0, 0, 0.5).m)
gl.drawArrays(gl.TRIANGLES, 0, 3)

const left = new Uint8Array(4)
const right = new Uint8Array(4)
gl.readPixels(25, 50, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, left)
gl.readPixels(75, 50, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, right)
assert(left.join(',') === '0,0,255,255', `深度测试：近者蓝覆盖 (${left.join(',')})`)
assert(right.join(',') === '255,0,0,255', `深度测试：右侧红保留 (${right.join(',')})`)
gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uTransform')!, false, Mat4.identity().m)

// ---- 3. 混合：blendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA) ----
gl.disable(gl.DEPTH_TEST)
gl.enable(gl.BLEND)
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
makeVAO([
    25, 25, 0, 1, 0, 0.5,
    75, 25, 0, 1, 0, 0.5,
    75, 75, 0, 1, 0, 0.5,
    25, 25, 0, 1, 0, 0.5,
    75, 75, 0, 1, 0, 0.5,
    25, 75, 0, 1, 0, 0.5,
])
gl.drawArrays(gl.TRIANGLES, 0, 6)
const blended = new Uint8Array(4)
// 采样 (35,60)：蓝区内且不在两三角形共享对角线上，避免二次混合
gl.readPixels(35, 60, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, blended)
// 蓝(0,0,255)*0.5 + 绿(0,255,0)*0.5 -> (0,127,127)
assert(Math.abs(blended[1] - 127) <= 2 && Math.abs(blended[2] - 127) <= 2, `blendFunc 混合: ${blended.join(',')} ~ (0,127,127)`)
gl.disable(gl.BLEND)

// ---- 4. 剔除：cullFace(BACK), frontFace(CCW) 默认 ----
gl.enable(gl.CULL_FACE)
gl.cullFace(gl.BACK)
gl.clearColor(1, 1, 1, 1)
gl.clear(gl.COLOR_BUFFER_BIT)

makeVAO([
    0, 0, 1, 0, 0, 1,
    0, 100, 1, 0, 0, 1,
    100, 0, 1, 0, 0, 1,
]) // 世界 CW（y 向上）-> 背面
gl.drawArrays(gl.TRIANGLES, 0, 3)
const culled = new Uint8Array(4)
gl.readPixels(25, 50, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, culled)
assert(culled.join(',') === '255,255,255,255', `cullFace(BACK): CW 三角形被剔除 (${culled.join(',')})`)

makeVAO([
    0, 0, 1, 0, 0, 1,
    100, 0, 1, 0, 0, 1,
    0, 100, 1, 0, 0, 1,
]) // 世界 CCW -> 正面
gl.drawArrays(gl.TRIANGLES, 0, 3)
const drawn = new Uint8Array(4)
gl.readPixels(25, 50, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, drawn)
assert(drawn.join(',') === '255,0,0,255', `cullFace(BACK): CCW 三角形保留 (${drawn.join(',')})`)
gl.disable(gl.CULL_FACE)

// ---- 5. drawElements：索引缓冲 ----
gl.clearColor(0, 0, 0, 1)
gl.clear(gl.COLOR_BUFFER_BIT)
makeVAO([
    20, 20, 1, 1, 1, 1,
    80, 20, 1, 1, 1, 1,
    80, 80, 1, 1, 1, 1,
    20, 80, 1, 1, 1, 1,
])
const ib = gl.createBuffer()
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib)
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW)
gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
const quad = new Uint8Array(4)
gl.readPixels(50, 50, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, quad)
assert(quad.join(',') === '255,255,255,255', `drawElements 索引绘制 (${quad.join(',')})`)

// ---- 6. TRIANGLE_STRIP 展开 ----
gl.clear(gl.COLOR_BUFFER_BIT)
makeVAO([
    20, 20, 1, 1, 1, 1,
    20, 80, 1, 1, 1, 1,
    80, 20, 1, 1, 1, 1,
    80, 80, 1, 1, 1, 1,
])
gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4) // strip 顺序
const strip = new Uint8Array(4)
gl.readPixels(50, 50, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, strip)
assert(strip.join(',') === '255,255,255,255', `TRIANGLE_STRIP 展开绘制 (${strip.join(',')})`)

// ---- 7. getError ----
gl.useProgram(null)
gl.drawArrays(gl.TRIANGLES, 0, 3)
assert(gl.getError() === gl.INVALID_OPERATION, '无程序绘制 -> INVALID_OPERATION')
gl.vertexAttribPointer(0, 2, 0x1404, false, 0, 0) // 非法 attribute 类型
assert(gl.getError() === gl.INVALID_ENUM, '非法 attribute 类型 -> INVALID_ENUM')
assert(gl.getError() === gl.NO_ERROR, 'getError 读取后清零')

console.log(failed === 0 ? 'ALL PASS' : `${failed} FAILED`)
