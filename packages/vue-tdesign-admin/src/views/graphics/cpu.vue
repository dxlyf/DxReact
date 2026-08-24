<script setup lang="ts">
/**
 * CPU 光栅化系统示例 —— 3D 立方体 + 线框叠加。
 *
 * 全部通过 WebGL 风格 API（CPURenderer）完成：
 *   createShader → shaderSource(JS stage) → compileShader
 *   → createProgram/attachShader/linkProgram/useProgram
 *   → createVertexArray/bindVertexArray → createBuffer/bufferData
 *   → vertexAttribPointer/enableVertexAttribArray → uniformMatrix4fv
 *   → clear → drawElements/drawArrays → putImageData 显示帧缓冲
 *
 * 渲染结果 = defaultFramebuffer（颜色+深度），用 CPUFramebuffer.toImageData() 输出到 canvas。
 */
import { ref, shallowRef, onMounted, onBeforeUnmount } from 'vue'
import GUI from 'lil-gui'
import {
    CPURenderer,
    Mat4,
    Vec4,
    type VertexStageSource,
    type FragmentStageSource,
} from './engine/raster/webgl'

const canvasRef = shallowRef<HTMLCanvasElement>()
const SIZE = 500
const DPR = window.devicePixelRatio || 1

// ==================== 立方体数据 ====================
// 6 个面 × 4 顶点，每面一个颜色（顶点 = [x, y, z, r, g, b]，绕序从外部看 CCW）
const FACES: { vs: [number, number, number][]; color: [number, number, number] }[] = [
    { vs: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], color: [1, 0, 0] }, // 前 +z 红
    { vs: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]], color: [0, 1, 1] }, // 后 -z 青
    { vs: [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]], color: [0, 1, 0] }, // 右 +x 绿
    { vs: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]], color: [1, 0, 1] }, // 左 -x 品红
    { vs: [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]], color: [0, 0, 1] }, // 上 +y 蓝
    { vs: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]], color: [1, 1, 0] }, // 下 -y 黄
]

// 交错顶点（pos3 + color3）+ 索引（36 = 6 面 × 2 三角形）
const cubeVertices = new Float32Array(24 * 6)
const cubeIndices = new Uint16Array(36)
{
    let vi = 0
    let ii = 0
    for (let f = 0; f < FACES.length; f++) {
        const [cr, cg, cb] = FACES[f].color
        for (const [x, y, z] of FACES[f].vs) {
            cubeVertices[vi++] = x
            cubeVertices[vi++] = y
            cubeVertices[vi++] = z
            cubeVertices[vi++] = cr
            cubeVertices[vi++] = cg
            cubeVertices[vi++] = cb
        }
        const base = f * 4
        cubeIndices[ii++] = base
        cubeIndices[ii++] = base + 1
        cubeIndices[ii++] = base + 2
        cubeIndices[ii++] = base
        cubeIndices[ii++] = base + 2
        cubeIndices[ii++] = base + 3
    }
}

// 线框：12 条边 × 2 顶点，亮色线（深背景下黑色不可见）
const CORNERS: [number, number, number][] = [
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
]
const EDGES: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 0], // 前面
    [4, 5], [5, 6], [6, 7], [7, 4], // 后面
    [0, 4], [1, 5], [2, 6], [3, 7], // 竖边
]
const WIRE_COLOR: [number, number, number] = [1, 1, 1]
const wireVertices = new Float32Array(EDGES.length * 2 * 6)
{
    let wi = 0
    for (const [a, b] of EDGES) {
        for (const idx of [a, b]) {
            const [x, y, z] = CORNERS[idx]
            wireVertices[wi++] = x
            wireVertices[wi++] = y
            wireVertices[wi++] = z
            wireVertices[wi++] = WIRE_COLOR[0]
            wireVertices[wi++] = WIRE_COLOR[1]
            wireVertices[wi++] = WIRE_COLOR[2]
        }
    }
}

// ==================== 实例化数据：彩色三角形环 ====================
// 同一个本地三角形，通过 divisor=1 的 aOffset（位置）+ aColor（颜色）实例化 60 份
const INSTANCE_COUNT = 60
const RING_RADIUS = 2.4
const RING_Z = -1.5 // 放在立方体后方，作为背景环
// 本地三角形（中心在原点，2 分量）
const instTriangle = new Float32Array([0, 0, 0.15, 0, 0.075, 0.13])
// 每实例偏移（每帧更新，展示实例属性可以动态刷新）
const instOffsets = new Float32Array(INSTANCE_COUNT * 2)
// 每实例颜色：HSV 彩虹渐变
const instColors = new Float32Array(INSTANCE_COUNT * 4)
for (let i = 0; i < INSTANCE_COUNT; i++) {
    const [r, g, b] = hsvToRgb(i / INSTANCE_COUNT, 0.85, 1)
    instColors[i * 4] = r
    instColors[i * 4 + 1] = g
    instColors[i * 4 + 2] = b
    instColors[i * 4 + 3] = 1
}

/** HSV（h∈[0,1]）→ RGB（[0,1]） */
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
    const i = Math.floor(h * 6)
    const f = h * 6 - i
    const p = v * (1 - s)
    const q = v * (1 - f * s)
    const t = v * (1 - (1 - f) * s)
    switch (i % 6) {
        case 0: return [v, t, p]
        case 1: return [q, v, p]
        case 2: return [p, v, t]
        case 3: return [p, q, v]
        case 4: return [t, p, v]
        default: return [v, p, q]
    }
}

// ==================== 着色器（自定义 3D stage，模拟 GLSL 源码）====================
const cubeVertexStage: VertexStageSource = {
    attribs: [
        { name: 'aPosition', size: 3 },
        { name: 'aColor', size: 3 },
    ],
    uniforms: ['uMVP'],
    main(attribs, uniforms) {
        const pos = attribs.getVec4('aPosition') // (x, y, z, 1)
        const clip = (uniforms.uMVP as Mat4).transformVec4(pos)
        const color = attribs.get('aColor')
        return {
            position: clip,
            varyings: color ? [color[0], color[1], color[2], 1] : [1, 1, 1, 1],
        }
    },
}

const cubeFragmentStage: FragmentStageSource = {
    main(input) {
        const c = input.varyings
        return new Vec4(c[0], c[1], c[2], c[3])
    },
}

// 实例化顶点着色器：aOffset/aColor 为 divisor=1 的每实例属性
const instancedVertexStage: VertexStageSource = {
    attribs: [
        { name: 'aPosition', size: 2 },
        { name: 'aOffset', size: 2 },
        { name: 'aColor', size: 4 },
    ],
    uniforms: ['uMVP'],
    main(attribs, uniforms) {
        const p = attribs.getVec4('aPosition')
        const off = attribs.get('aOffset') ?? new Float32Array([0, 0])
        const color = attribs.get('aColor') ?? new Float32Array([1, 1, 1, 1])
        const clip = (uniforms.uMVP as Mat4).transformVec4(new Vec4(p.x + off[0], p.y + off[1], RING_Z, 1))
        return { position: clip, varyings: [color[0], color[1], color[2], color[3]] }
    },
}

// ==================== 渲染状态 ====================
const options = ref({ wireframe: true, rotate: true, instanced: true })
const fps = ref(0)
let frameCount = 0
let fpsLast = performance.now()
let gui: GUI | null = null
let gl: CPURenderer | null = null
let program: ReturnType<CPURenderer['createProgram']> | null = null
let mvpLoc: ReturnType<CPURenderer['getUniformLocation']> = null
let cubeVAO: ReturnType<CPURenderer['createVertexArray']> | null = null
let wireVAO: ReturnType<CPURenderer['createVertexArray']> | null = null
let instProgram: ReturnType<CPURenderer['createProgram']> | null = null
let instMvpLoc: ReturnType<CPURenderer['getUniformLocation']> = null
let instVAO: ReturnType<CPURenderer['createVertexArray']> | null = null
let instOffsetsBuffer: ReturnType<CPURenderer['createBuffer']> | null = null
let raf = 0

/** 绕 X 轴旋转矩阵（列主序） */
function rotX(a: number): Mat4 {
    const c = Math.cos(a)
    const s = Math.sin(a)
    const m = new Float32Array(16)
    m[0] = 1
    m[5] = c
    m[6] = s
    m[9] = -s
    m[10] = c
    m[15] = 1
    return new Mat4(m)
}

/** 绕 Y 轴旋转矩阵（列主序） */
function rotY(a: number): Mat4 {
    const c = Math.cos(a)
    const s = Math.sin(a)
    const m = new Float32Array(16)
    m[0] = c
    m[2] = -s
    m[5] = 1
    m[8] = s
    m[10] = c
    m[15] = 1
    return new Mat4(m)
}

function render(ts: number): void {
    const renderer = gl!
    const ctx = canvasRef.value!.getContext('2d')!
    const t = ts / 1000

    // FPS 统计（每 0.5s 更新一次显示）
    frameCount++
    const now = performance.now()
    if (now - fpsLast >= 500) {
        fps.value = Math.round(frameCount / ((now - fpsLast) / 1000))
        frameCount = 0
        fpsLast = now
    }

    // MVP = P * V * M（相机在 +z 看向原点）
    const model = options.value.rotate ? Mat4.multiply(rotY(t * 0.6), rotX(t * 0.4)) : Mat4.identity()
    const view = Mat4.translation(0, 0, -4)
    const projection = Mat4.perspective(Math.PI / 3, SIZE / SIZE, 0.1, 100)
    const mvp = Mat4.multiply(projection, view).multiply(model)
    // 实例环不随立方体旋转：P * V
    const pv = Mat4.multiply(projection, view)

    renderer.clearColor(0.05, 0.05, 0.08, 1)
    renderer.clear(renderer.COLOR_BUFFER_BIT | renderer.DEPTH_BUFFER_BIT)

    // 实例化三角形环（背景层，z 更远）
    if (options.value.instanced) {
        renderer.useProgram(instProgram)
        renderer.uniformMatrix4fv(instMvpLoc, false, pv.m)
        renderer.disable(renderer.CULL_FACE) // 实例三角形绕序固定，无需剔除

        // 每帧更新实例偏移：绕原点缓慢旋转的圆环（divisor=1，一实例一个元素）
        const ang = t * 0.8
        for (let i = 0; i < INSTANCE_COUNT; i++) {
            const a = ang + (i / INSTANCE_COUNT) * Math.PI * 2
            instOffsets[i * 2] = Math.cos(a) * RING_RADIUS
            instOffsets[i * 2 + 1] = Math.sin(a) * RING_RADIUS
        }
        renderer.bindBuffer(renderer.ARRAY_BUFFER, instOffsetsBuffer)
        renderer.bufferData(renderer.ARRAY_BUFFER, instOffsets, renderer.DYNAMIC_DRAW)

        renderer.bindVertexArray(instVAO)
        renderer.drawArraysInstanced(renderer.TRIANGLES, 0, 3, INSTANCE_COUNT)
    }

    // 实体立方体（深度测试 + 背面剔除）
    renderer.useProgram(program)
    renderer.uniformMatrix4fv(mvpLoc, false, mvp.m)
    renderer.enable(renderer.DEPTH_TEST)
    renderer.enable(renderer.CULL_FACE)
    renderer.bindVertexArray(cubeVAO)
    renderer.drawElements(renderer.TRIANGLES, 36, renderer.UNSIGNED_SHORT, 0)

    // 线框叠加：LEQUAL 保证与表面共面的边能通过深度测试
    if (options.value.wireframe) {
        renderer.depthFunc(renderer.LEQUAL)
        renderer.bindVertexArray(wireVAO)
        renderer.drawArrays(renderer.LINES, 0, EDGES.length * 2)
        renderer.depthFunc(renderer.LESS)
    }

    // 帧缓冲 -> canvas（内部为左上原点，直接 putImageData）
    ctx.putImageData(renderer.defaultFramebuffer.toImageData(), 0, 0)
    raf = requestAnimationFrame(render)
}

onMounted(() => {
    const canvas = canvasRef.value!
    canvas.width = SIZE * DPR
    canvas.height = SIZE * DPR
    canvas.style.width = `${SIZE}px`
    canvas.style.height = `${SIZE}px`

    gl = new CPURenderer({ width: SIZE * DPR, height: SIZE * DPR })

    // 编译着色器（WebGL 风格流程）
    const vs = gl.createShader(gl.VERTEX_SHADER)!
    gl.shaderSource(vs, cubeVertexStage)
    gl.compileShader(vs)
    const fs = gl.createShader(gl.FRAGMENT_SHADER)!
    gl.shaderSource(fs, cubeFragmentStage)
    gl.compileShader(fs)

    program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    gl.useProgram(program)

    const aPos = gl.getAttribLocation(program, 'aPosition')
    const aColor = gl.getAttribLocation(program, 'aColor')
    mvpLoc = gl.getUniformLocation(program, 'uMVP')

    // 立方体 VAO（交错 pos3+color3，stride 24 字节，颜色偏移 12 字节）
    cubeVAO = gl.createVertexArray()
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

    // 线框 VAO（无需索引）
    wireVAO = gl.createVertexArray()
    gl.bindVertexArray(wireVAO)
    const wireVBO = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, wireVBO)
    gl.bufferData(gl.ARRAY_BUFFER, wireVertices, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 24, 0)
    gl.enableVertexAttribArray(aColor)
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 24, 12)

    // 实例化 program：aPosition(2) + aOffset(2, divisor=1) + aColor(4, divisor=1)
    const ivs = gl.createShader(gl.VERTEX_SHADER)!
    gl.shaderSource(ivs, instancedVertexStage)
    gl.compileShader(ivs)
    instProgram = gl.createProgram()
    gl.attachShader(instProgram, ivs)
    gl.attachShader(instProgram, fs)
    gl.linkProgram(instProgram)

    const iPos = gl.getAttribLocation(instProgram, 'aPosition')
    const iOff = gl.getAttribLocation(instProgram, 'aOffset')
    const iColor = gl.getAttribLocation(instProgram, 'aColor')
    instMvpLoc = gl.getUniformLocation(instProgram, 'uMVP')

    // 实例 VAO：本地三角形 + 每实例 offset/color
    instVAO = gl.createVertexArray()
    gl.bindVertexArray(instVAO)
    const instVBO = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, instVBO)
    gl.bufferData(gl.ARRAY_BUFFER, instTriangle, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(iPos)
    gl.vertexAttribPointer(iPos, 2, gl.FLOAT, false, 0, 0)
    instOffsetsBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, instOffsetsBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, instOffsets, gl.DYNAMIC_DRAW)
    gl.enableVertexAttribArray(iOff)
    gl.vertexAttribPointer(iOff, 2, gl.FLOAT, false, 0, 0)
    gl.vertexAttribDivisor(iOff, 1) // 每实例前进一个元素
    const instColorVBO = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, instColorVBO)
    gl.bufferData(gl.ARRAY_BUFFER, instColors, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(iColor)
    gl.vertexAttribPointer(iColor, 4, gl.FLOAT, false, 0, 0)
    gl.vertexAttribDivisor(iColor, 1) // 每实例前进一个元素

    gui = new GUI()
    gui.add(options.value, 'wireframe').name('线框')
    gui.add(options.value, 'rotate').name('旋转')
    gui.add(options.value, 'instanced').name('实例化')

    raf = requestAnimationFrame(render)
})

onBeforeUnmount(() => {
    cancelAnimationFrame(raf)
    gui?.destroy()
    gl?.destroy()
})
</script>

<template>
    <div class="demo">
        <div class="toolbar">
            <span class="fps">FPS: {{ fps }}</span>
        </div>
        <canvas ref="canvasRef"></canvas>
        <p>3D 立方体：CPU 光栅化（深度测试 + 背面剔除 + 透视校正插值）+ 线框叠加 + 实例化三角形环</p>
    </div>
</template>

<style scoped>
.demo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 16px;
}
.toolbar {
    display: flex;
    justify-content: center;
    width: 100%;
}
.fps {
    font-family: monospace;
    font-size: 13px;
    color: #4caf50;
    background: rgba(0, 0, 0, 0.5);
    padding: 4px 10px;
    border-radius: 4px;
}
canvas {
    border: 1px solid #333;
    background: #0d0d14;
}
p {
    margin: 0;
    color: #888;
    font-size: 12px;
}
</style>
