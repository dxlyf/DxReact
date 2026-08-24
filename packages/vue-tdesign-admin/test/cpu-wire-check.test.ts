// 临时验证：线框是否真正被光栅化（用后即删）
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
const CORNERS: [number, number, number][] = [
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
]
const EDGES: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
]
const WIRE_COLOR: [number, number, number] = [1, 1, 1]
const wireVertices = new Float32Array(EDGES.length * 2 * 6)
{
    let wi = 0
    for (const [a, b] of EDGES) {
        for (const idx of [a, b]) {
            const [x, y, z] = CORNERS[idx]
            wireVertices[wi++] = x; wireVertices[wi++] = y; wireVertices[wi++] = z
            wireVertices[wi++] = WIRE_COLOR[0]; wireVertices[wi++] = WIRE_COLOR[1]; wireVertices[wi++] = WIRE_COLOR[2]
        }
    }
}

// 立方体 VAO
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

// 线框 VAO
const wireVAO = gl.createVertexArray()
gl.bindVertexArray(wireVAO)
const wireVBO = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, wireVBO)
gl.bufferData(gl.ARRAY_BUFFER, wireVertices, gl.STATIC_DRAW)
gl.enableVertexAttribArray(aPos)
gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 24, 0)
gl.enableVertexAttribArray(aColor)
gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 24, 12)

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

let failed = 0
function assert(cond: boolean, msg: string) {
    if (!cond) { console.error(`FAIL: ${msg}`); failed++ } else console.log(`ok: ${msg}`)
}

const t = 0.3
const model = Mat4.multiply(rotY(t * 0.6), rotX(t * 0.4))
const view = Mat4.translation(0, 0, -4)
const projection = Mat4.perspective(Math.PI / 3, 1, 0.1, 100)
const mvp = Mat4.multiply(projection, view).multiply(model)

// 场景 A：只画线框，确认白色像素被光栅化
gl.useProgram(program)
gl.uniformMatrix4fv(mvpLoc, false, mvp.m)
gl.clearColor(0.05, 0.05, 0.08, 1)
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
gl.disable(gl.DEPTH_TEST)
gl.disable(gl.CULL_FACE)
gl.bindVertexArray(wireVAO)
gl.drawArrays(gl.LINES, 0, EDGES.length * 2)

let white = 0
let blackish = 0
const fb = gl.defaultFramebuffer
for (let y = 0; y < SIZE; y += 2) {
    for (let x = 0; x < SIZE; x += 2) {
        const c = fb.readColor(x, y)
        if (c[0] > 200 && c[1] > 200 && c[2] > 200) white++
        else if (c[0] < 40 && c[1] < 40 && c[2] < 40) blackish++
    }
}
assert(white > 50, `场景A: 白色线框像素被光栅化 (${white} 个)`)
assert(white + blackish < SIZE * SIZE / 4, `场景A: 线条占比合理 (${white} 白 / ${blackish} 背景)`)

// 场景 B：实体 + 线框（LEQUAL），检查线框叠加在面上
gl.enable(gl.DEPTH_TEST)
gl.enable(gl.CULL_FACE)
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
gl.bindVertexArray(cubeVAO)
gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0)
gl.depthFunc(gl.LEQUAL)
gl.bindVertexArray(wireVAO)
gl.drawArrays(gl.LINES, 0, EDGES.length * 2)
gl.depthFunc(gl.LESS)

let whiteOnFace = 0
for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
        const c = fb.readColor(x, y)
        if (c[0] > 200 && c[1] > 200 && c[2] > 200) whiteOnFace++
    }
}
assert(whiteOnFace > 50, `场景B: 线框叠加在实体上 (${whiteOnFace} 个白像素)`)
// 中心不应是纯白（那是红/蓝面），说明线框只覆盖边
const center = fb.readColor(100, 100)
assert(center[0] < 200 || center[1] < 200 || center[2] < 200, `场景B: 面中心非纯白 (${center.join(',')})`)

console.log(failed === 0 ? 'ALL PASS' : `${failed} FAILED`)
