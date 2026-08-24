// 临时验证：cpu.vue 的立方体渲染逻辑（用后即删）
import { CPURenderer, Mat4, Vec4, type VertexStageSource, type FragmentStageSource } from './src/views/graphics/engine/raster/cpu/index'

const SIZE = 200
const gl = new CPURenderer({ width: SIZE, height: SIZE })

const cubeVertexStage: VertexStageSource = {
    attribs: [
        { name: 'aPosition', size: 3 },
        { name: 'aColor', size: 3 },
    ],
    uniforms: ['uMVP'],
    main(attribs, uniforms) {
        const pos = attribs.getVec4('aPosition')
        const clip = (uniforms.uMVP as Mat4).transformVec4(pos)
        const color = attribs.get('aColor')
        return { position: clip, varyings: color ? [color[0], color[1], color[2], 1] : [1, 1, 1, 1] }
    },
}
const cubeFragmentStage: FragmentStageSource = {
    main(input) {
        const c = input.varyings
        return new Vec4(c[0], c[1], c[2], c[3])
    },
}

const vs = gl.createShader(gl.VERTEX_SHADER)!
gl.shaderSource(vs, cubeVertexStage)
gl.compileShader(vs)
const fs = gl.createShader(gl.FRAGMENT_SHADER)!
gl.shaderSource(fs, cubeFragmentStage)
gl.compileShader(fs)
const program = gl.createProgram()
gl.attachShader(program, vs)
gl.attachShader(program, fs)
gl.linkProgram(program)
gl.useProgram(program)
const aPos = gl.getAttribLocation(program, 'aPosition')
const aColor = gl.getAttribLocation(program, 'aColor')
const mvpLoc = gl.getUniformLocation(program, 'uMVP')

// 立方体数据（与 cpu.vue 相同）
const FACES: { vs: [number, number, number][]; color: [number, number, number] }[] = [
    { vs: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], color: [1, 0, 0] },
    { vs: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]], color: [0, 1, 1] },
    { vs: [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]], color: [0, 1, 0] },
    { vs: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]], color: [1, 0, 1] },
    { vs: [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]], color: [0, 0, 1] },
    { vs: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]], color: [1, 1, 0] },
]
const cubeVertices = new Float32Array(24 * 6)
const cubeIndices = new Uint16Array(36)
{
    let vi = 0, ii = 0
    for (let f = 0; f < FACES.length; f++) {
        const [cr, cg, cb] = FACES[f].color
        for (const [x, y, z] of FACES[f].vs) {
            cubeVertices[vi++] = x; cubeVertices[vi++] = y; cubeVertices[vi++] = z
            cubeVertices[vi++] = cr; cubeVertices[vi++] = cg; cubeVertices[vi++] = cb
        }
        const base = f * 4
        cubeIndices[ii++] = base; cubeIndices[ii++] = base + 1; cubeIndices[ii++] = base + 2
        cubeIndices[ii++] = base; cubeIndices[ii++] = base + 2; cubeIndices[ii++] = base + 3
    }
}

// VAO
const cubeVAO = gl.createVertexArray()
gl.bindVertexArray(cubeVAO)
const cubeVBO = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, cubeVBO)
gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW)
gl.enableVertexAttribArray(aPos)
gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 24, 0)
gl.enableVertexAttribArray(aColor)
gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 24, 12)
const cubeIBO = gl.createBuffer()
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIBO)
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeIndices, gl.STATIC_DRAW)

function rotX(a: number): Mat4 {
    const c = Math.cos(a), s = Math.sin(a)
    const m = new Float32Array(16)
    m[0] = 1; m[5] = c; m[6] = s; m[9] = -s; m[10] = c; m[15] = 1
    return new Mat4(m)
}
function rotY(a: number): Mat4 {
    const c = Math.cos(a), s = Math.sin(a)
    const m = new Float32Array(16)
    m[0] = c; m[2] = -s; m[5] = 1; m[8] = s; m[10] = c; m[15] = 1
    return new Mat4(m)
}

// 渲染一帧（0.3 秒处，绕 Y 约 18°）
function drawFrame(t: number) {
    const model = Mat4.multiply(rotY(t * 0.6), rotX(t * 0.4))
    const view = Mat4.translation(0, 0, -4)
    const projection = Mat4.perspective(Math.PI / 3, 1, 0.1, 100)
    const mvp = Mat4.multiply(projection, view).multiply(model)
    gl.useProgram(program)
    gl.uniformMatrix4fv(mvpLoc, false, mvp.m)
    gl.clearColor(0.05, 0.05, 0.08, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)
    gl.bindVertexArray(cubeVAO)
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0)
}

let failed = 0
function assert(cond: boolean, msg: string) {
    if (!cond) { console.error(`FAIL: ${msg}`); failed++ } else console.log(`ok: ${msg}`)
}

drawFrame(0.3)
const fb = gl.defaultFramebuffer
// 中心应为某一面颜色（不是背景）
const center = fb.readColor(100, 100)
assert(center[0] > 30 || center[1] > 30 || center[2] > 30, `中心被立方体覆盖 (${center.join(',')})`)
// 角落应为背景色
const corner = fb.readColor(5, 5)
assert(corner[0] <= 20 && corner[1] <= 20 && corner[2] <= 20, `角落为背景 (${corner.join(',')})`)
// 深度缓冲有内容（中心 < 1）
assert(fb.readDepth(100, 100) < 1, `中心有深度 (${fb.readDepth(100, 100)})`)
// 背面剔除：前后两个面在中心附近只应有较近的一层（读取几个像素确认非空白/非纯背景）
let covered = 0
for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
        const c = fb.readColor(60 + i * 9, 60 + j * 9)
        if (c[0] > 20 || c[1] > 20 || c[2] > 20) covered++
    }
}
assert(covered > 50, `中心区域覆盖率 ${covered}/100`)

console.log(failed === 0 ? 'ALL PASS' : `${failed} FAILED`)
