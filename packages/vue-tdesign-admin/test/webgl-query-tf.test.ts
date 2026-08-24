// 验证 WebGL2 查询对象 + 变换反馈
import { CPURenderer, Vec4, type CPUQuery, type CPUTransformFeedback } from '../src/views/graphics/engine/raster/webgl/index'

const gl = new CPURenderer({ width: 300, height: 300 })
let pass = 0, fail = 0
const assert = (name: string, cond: boolean) => {
    if (cond) { pass++; console.log(`PASS ${name}`) } else { fail++; console.log(`FAIL ${name}`) }
}

// 顶点着色器：aPosition -> clip + varyings 输出（位置分量 + 常量颜色，声明 varyings 名）
const vs = gl.createShader(gl.VERTEX_SHADER)!
gl.shaderSource(vs, {
    attribs: [{ name: 'aPosition', size: 2 }],
    varyings: [{ name: 'vPos', size: 2 }, { name: 'vColor', size: 3 }],
    main(attribs) {
        const p = attribs.get('aPosition')!
        return { position: new Vec4(p[0], p[1], 0, 1), varyings: [p[0], p[1], 1, 0, 0] }
    },
})
gl.compileShader(vs)
const fs = gl.createShader(gl.FRAGMENT_SHADER)!
gl.shaderSource(fs, {
    main(input) {
        const c = input.varyings
        return new Vec4(c[2], c[3], c[4], 1)
    },
})
gl.compileShader(fs)

// 程序 A：SEPARATE_ATTRIBS 捕获 vPos 与 vColor
const progA = gl.createProgram()
gl.attachShader(progA, vs)
gl.attachShader(progA, fs)
gl.transformFeedbackVaryings(progA, ['vPos', 'vColor'], gl.SEPARATE_ATTRIBS)
gl.linkProgram(progA)
assert('link ok', gl.getProgramParameter(progA, gl.LINK_STATUS) === true)
gl.useProgram(progA)

// 顶点缓冲：2 个三角形
const vao = gl.createVertexArray()
gl.bindVertexArray(vao)
const vbo = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0, 0, 1, 0, 0, 1, // 三角形 1
    1, 1, 2, 1, 1, 2, // 三角形 2
]), gl.STATIC_DRAW)
const aPos = gl.getAttribLocation(progA, 'aPosition')
gl.enableVertexAttribArray(aPos)
gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

// 变换反馈缓冲（SEPARATE：vPos 写 buffer0，vColor 写 buffer1）
const tf = gl.createTransformFeedback()
gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf)
const tfPos = gl.createBuffer()
gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, tfPos)
gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER, new Float32Array(16), gl.DYNAMIC_COPY)
gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, tfPos)
const tfColor = gl.createBuffer()
gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, tfColor)
gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER, new Float32Array(16), gl.DYNAMIC_COPY)
gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, tfColor)

// 查询：TF 写入图元数 + 遮挡查询
const qPrim = gl.createQuery()
gl.beginQuery(gl.TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN, qPrim)
const qAny = gl.createQuery()
gl.beginQuery(gl.ANY_SAMPLES_PASSED, qAny)

gl.beginTransformFeedback(gl.TRIANGLES)
gl.drawArrays(gl.TRIANGLES, 0, 6)
gl.endTransformFeedback()

gl.endQuery(gl.ANY_SAMPLES_PASSED)
gl.endQuery(gl.TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN)

assert('TF 写入 2 个图元', gl.getQueryParameter(qPrim, gl.QUERY_RESULT) === 2)
assert('遮挡查询通过', gl.getQueryParameter(qAny, gl.QUERY_RESULT) === 1)
assert('结果可用', gl.getQueryParameter(qPrim, gl.QUERY_RESULT_AVAILABLE) === true)
assert('已结束查询非激活', gl.getQueryParameter(qPrim, gl.CURRENT_QUERY) === 0)

// 回读 TF 缓冲（vPos：按顶点引用顺序，6 个顶点 × 2 分量）
gl.bindBuffer(gl.ARRAY_BUFFER, tfPos)
gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, tfPos)
const posData = tfPos.data as Float32Array
assert('vPos[0]=(0,0)', posData[0] === 0 && posData[1] === 0)
assert('vPos[3]=(1,1) 第4顶点', posData[6] === 1 && posData[7] === 1)
assert('vPos[5]=(1,2) 第6顶点', posData[10] === 1 && posData[11] === 2)

// vColor 缓冲（每个顶点 3 分量，共 18 元素）
const colorData = tfColor.data as Float32Array
assert('vColor 前 3 分量 (1,0,0)', colorData[0] === 1 && colorData[1] === 0 && colorData[2] === 0)
assert('vColor[6] 第 3 顶点 (1,0,0)', colorData[6] === 1 && colorData[7] === 0 && colorData[8] === 0)

// ---- INTERLEAVED_ATTRIBS（捕获 vPos+vColor 连续区间）----
const progB = gl.createProgram()
gl.attachShader(progB, vs)
gl.attachShader(progB, fs)
gl.transformFeedbackVaryings(progB, ['vPos', 'vColor'], gl.INTERLEAVED_ATTRIBS)
gl.linkProgram(progB)
gl.useProgram(progB)

const tf2 = gl.createTransformFeedback()
gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf2)
const tf2Buf = gl.createBuffer()
gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, tf2Buf)
gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER, new Float32Array(32), gl.DYNAMIC_COPY)
gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, tf2Buf)

gl.bindVertexArray(vao)
gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
gl.beginTransformFeedback(gl.TRIANGLES)
gl.drawArrays(gl.TRIANGLES, 0, 6)
gl.endTransformFeedback()

const interData = tf2Buf.data as Float32Array
// 每顶点 5 分量交错：[vPos.x, vPos.y, vColor.r, vColor.g, vColor.b]
// 顶点1 (0,0) → [0,0,1,0,0]；顶点2 (1,0) → [1,0,1,0,0]；顶点3 (0,1) → [0,1,1,0,0]
assert('INTERLEAVED 顶点1', interData[0] === 0 && interData[1] === 0 && interData[2] === 1 && interData[3] === 0 && interData[4] === 0)
assert('INTERLEAVED 顶点2', interData[5] === 1 && interData[6] === 0 && interData[7] === 1)
assert('INTERLEAVED 顶点3', interData[10] === 0 && interData[11] === 1)

// ---- 遮挡查询：无可见像素时为 0 ----
const gl2 = new CPURenderer({ width: 100, height: 100 })
const vs2 = gl2.createShader(gl2.VERTEX_SHADER)!
gl2.shaderSource(vs2, {
    attribs: [{ name: 'aPosition', size: 2 }],
    main(attribs) {
        const p = attribs.get('aPosition')!
        return { position: new Vec4(p[0], p[1], 0, 1), varyings: [] }
    },
})
gl2.compileShader(vs2)
const fs2 = gl2.createShader(gl2.FRAGMENT_SHADER)!
gl2.shaderSource(fs2, { main() { return new Vec4(1, 0, 0, 1) } })
gl2.compileShader(fs2)
const progC = gl2.createProgram()
gl2.attachShader(progC, vs2)
gl2.attachShader(progC, fs2)
gl2.linkProgram(progC)
gl2.useProgram(progC)
const vao2 = gl2.createVertexArray()
gl2.bindVertexArray(vao2)
const vbo2 = gl2.createBuffer()
gl2.bindBuffer(gl2.ARRAY_BUFFER, vbo2)
gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1]), gl2.STATIC_DRAW)
const aPos2 = gl2.getAttribLocation(progC, 'aPosition')
gl2.enableVertexAttribArray(aPos2)
gl2.vertexAttribPointer(aPos2, 2, gl2.FLOAT, false, 0, 0)

// 视口外绘制：不可见
gl2.viewport(1000, 1000, 100, 100)
const qOcc = gl2.createQuery()
gl2.beginQuery(gl2.ANY_SAMPLES_PASSED, qOcc)
gl2.drawArrays(gl2.TRIANGLES, 0, 3)
gl2.endQuery(gl2.ANY_SAMPLES_PASSED)
assert('遮挡查询 视口外为 0', gl2.getQueryParameter(qOcc, gl2.QUERY_RESULT) === 0)

// 错误校验
gl2.beginQuery(9999, gl2.createQuery())
assert('beginQuery 非法目标 INVALID_ENUM', gl2.getError() === gl2.INVALID_ENUM)

console.log(`\n结果: ${pass} 通过, ${fail} 失败`)
