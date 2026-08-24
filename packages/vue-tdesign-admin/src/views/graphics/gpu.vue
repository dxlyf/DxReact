<script setup lang="ts">
/**
 * WebGPU 示例 —— 3D 立方体 + 线框 + 实例化三角形环。
 *
 * 用真实 WebGPU 的对象模型编写（可在浏览器用真 GPU 平移）：
 *   gpu.requestAdapter() → adapter.requestDevice() → device
 *   → createShaderModule / createBuffer / createRenderPipeline / createBindGroup
 *   → createCommandEncoder() → beginRenderPass()
 *   → setPipeline / setBindGroup / setVertexBuffer / setIndexBuffer / drawIndexed
 *   → end() → finish() → queue.submit() → 显示帧缓冲
 *
 * 本示例刻意体现 WebGPU 与 WebGL 的差异：
 *   1. 渲染管线不可变：立方体 / 线框 / 实例化环是 3 条独立 pipeline，
 *      深度与剔除状态在 createRenderPipeline 时固化，绘制只 setPipeline。
 *   2. 绑定组：MVP 矩阵放 UNIFORM buffer，通过 setBindGroup 绑定。
 *   3. 投影矩阵用 perspectiveZeroToOne（NDC z∈[0,1]，非 WebGL 的 [-1,1]）。
 *   4. 顶点属性用 format + shaderLocation 描述（stride 16 交错 pos3 + unorm8x4 color）。
 *   5. 实例化用 stepMode: 'instance' 的顶点缓冲布局。
 */
import { ref, shallowRef, onMounted, onBeforeUnmount } from 'vue'
import GUI from 'lil-gui'
import {
    gpu,
    Mat4,
    Vec4,
    perspectiveZeroToOne,
    BufferUsage,
    type WGSLCode,
    type GPUDevice,
    type GPURenderPipeline,
    type GPUBuffer,
    type GPUTexture,
    type GPUBindGroup,
    type GPUCanvasContext,
} from './engine/raster/webgpu'

const canvasRef = shallowRef<HTMLCanvasElement>()
const SIZE = 500
const DPR = window.devicePixelRatio || 1

// ==================== 立方体数据（pos float32x3 + color unorm8x4，stride 16）====================
const FACES: { vs: [number, number, number][]; color: [number, number, number] }[] = [
    { vs: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], color: [255, 60, 60] }, // 前 +z 红
    { vs: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]], color: [0, 220, 220] }, // 后 -z 青
    { vs: [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]], color: [60, 220, 60] }, // 右 +x 绿
    { vs: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]], color: [230, 60, 230] }, // 左 -x 品红
    { vs: [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]], color: [60, 60, 255] }, // 上 +y 蓝
    { vs: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]], color: [230, 230, 60] }, // 下 -y 黄
]
// 交错顶点（12 字节位置 + 4 字节颜色）+ 索引（36 = 6 面 × 2 三角形）
const cubeVertices = new ArrayBuffer(24 * 16)
const cubeIndices = new Uint16Array(36)
{
    const dv = new DataView(cubeVertices)
    let vo = 0
    let ii = 0
    for (let f = 0; f < FACES.length; f++) {
        const [cr, cg, cb] = FACES[f].color
        for (const [x, y, z] of FACES[f].vs) {
            dv.setFloat32(vo, x, true)
            dv.setFloat32(vo + 4, y, true)
            dv.setFloat32(vo + 8, z, true)
            dv.setUint8(vo + 12, cr)
            dv.setUint8(vo + 13, cg)
            dv.setUint8(vo + 14, cb)
            dv.setUint8(vo + 15, 255)
            vo += 16
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

// 线框：12 条边 × 2 顶点，只存位置（float32x3，独立管线）
const CORNERS: [number, number, number][] = [
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
]
const EDGES: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 0], // 前面
    [4, 5], [5, 6], [6, 7], [7, 4], // 后面
    [0, 4], [1, 5], [2, 6], [3, 7], // 竖边
]
const wireVertices = new Float32Array(EDGES.length * 2 * 3)
{
    let wi = 0
    for (const [a, b] of EDGES) {
        for (const idx of [a, b]) {
            const [x, y, z] = CORNERS[idx]
            wireVertices[wi++] = x
            wireVertices[wi++] = y
            wireVertices[wi++] = z
        }
    }
}

// ==================== 实例化三角形环 ====================
const INSTANCE_COUNT = 60
const RING_RADIUS = 2.4
const RING_Z = -1.5 // 立方体后方背景环
const instTriangle = new Float32Array([0, 0, 0.15, 0, 0.075, 0.13]) // 本地三角形（float32x2）
const instOffsets = new Float32Array(INSTANCE_COUNT * 2) // 每实例偏移（每帧更新）
const instColors = new Float32Array(INSTANCE_COUNT * 4) // 每实例颜色：HSV 彩虹
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

/** 列主序 mat4（来自 uniform buffer 的 Float32Array）× vec4 */
function mulVec4(m: Float32Array, v: Vec4): Vec4 {
    return new Vec4(
        m[0] * v.x + m[4] * v.y + m[8] * v.z + m[12] * v.w,
        m[1] * v.x + m[5] * v.y + m[9] * v.z + m[13] * v.w,
        m[2] * v.x + m[6] * v.y + m[10] * v.z + m[14] * v.w,
        m[3] * v.x + m[7] * v.y + m[11] * v.z + m[15] * v.w,
    )
}

// ==================== 着色器（WGSL 文本仅展示，JS 入口实际执行）====================
// 立方体：pos(location 0) + color(location 1)，uniform buffer binding 0 = MVP
const cubeWGSL: WGSLCode = {
    source: `
struct VsOut { @builtin(position) pos: vec4f, @location(0) color: vec4f }
@group(0) @binding(0) var<uniform> uMVP: mat4x4f;
@vertex fn vs_main(@location(0) pos: vec3f, @location(1) color: vec4f) -> VsOut {
    var out: VsOut;
    out.pos = uMVP * vec4f(pos, 1.0);
    out.color = color;
    return out;
}
@fragment fn fs_main(@location(0) color: vec4f) -> @location(0) vec4f { return color; }`,
    vertex(input) {
        const pos = input.location(0)!
        const color = input.location(1)!
        const mvp = input.bindings[0] as Float32Array
        return {
            position: mulVec4(mvp, new Vec4(pos[0], pos[1], pos[2], 1)),
            varyings: [color[0], color[1], color[2], color[3]],
        }
    },
    fragment(input) {
        const c = input.varyings
        return new Vec4(c[0], c[1], c[2], c[3])
    },
}

// 线框：只读位置，输出纯白（depthCompare 'less-equal' + 不写深度 → 贴表面）
const wireWGSL: WGSLCode = {
    source: `
struct VsOut { @builtin(position) pos: vec4f, @location(0) color: vec4f }
@group(0) @binding(0) var<uniform> uMVP: mat4x4f;
@vertex fn vs_main(@location(0) pos: vec3f) -> VsOut {
    var out: VsOut;
    out.pos = uMVP * vec4f(pos, 1.0);
    out.color = vec4f(1.0);
    return out;
}
@fragment fn fs_main(@location(0) color: vec4f) -> @location(0) vec4f { return color; }`,
    vertex(input) {
        const pos = input.location(0)!
        const mvp = input.bindings[0] as Float32Array
        return { position: mulVec4(mvp, new Vec4(pos[0], pos[1], pos[2], 1)), varyings: [1, 1, 1, 1] }
    },
    fragment() {
        return new Vec4(1, 1, 1, 1)
    },
}

// 实例化环：位置(location 0) + 每实例偏移(location 1) + 每实例颜色(location 2)
const instWGSL: WGSLCode = {
    source: `
struct VsOut { @builtin(position) pos: vec4f, @location(0) color: vec4f }
@group(0) @binding(0) var<uniform> uPV: mat4x4f;
@vertex fn vs_main(@location(0) pos: vec2f, @location(1) off: vec2f, @location(2) color: vec4f) -> VsOut {
    var out: VsOut;
    out.pos = uPV * vec4f(pos + off, ${RING_Z}, 1.0);
    out.color = color;
    return out;
}
@fragment fn fs_main(@location(0) color: vec4f) -> @location(0) vec4f { return color; }`,
    vertex(input) {
        const pos = input.location(0)!
        const off = input.location(1)!
        const color = input.location(2)!
        const pv = input.bindings[0] as Float32Array
        return {
            position: mulVec4(pv, new Vec4(pos[0] + off[0], pos[1] + off[1], RING_Z, 1)),
            varyings: [color[0], color[1], color[2], color[3]],
        }
    },
    fragment(input) {
        const c = input.varyings
        return new Vec4(c[0], c[1], c[2], c[3])
    },
}

// ==================== 渲染状态 ====================
const options = ref({ wireframe: true, rotate: true, instanced: true })
const fps = ref(0)
let frameCount = 0
let fpsLast = performance.now()
let gui: GUI | null = null
let raf = 0
let ctx2d: CanvasRenderingContext2D | null = null
let gpuCtx: GPUCanvasContext | null = null

// 资源句柄
let device: GPUDevice
let cubePipeline: GPURenderPipeline
let wirePipeline: GPURenderPipeline
let instPipeline: GPURenderPipeline
let cubeVertexBuffer: GPUBuffer
let cubeIndexBuffer: GPUBuffer
let wireVertexBuffer: GPUBuffer
let triBuffer: GPUBuffer
let offsetsBuffer: GPUBuffer
let colorsBuffer: GPUBuffer
let mvpBuffer: GPUBuffer
let pvBuffer: GPUBuffer
let depthTex: GPUTexture
let mvpGroup: GPUBindGroup
let pvGroup: GPUBindGroup

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
    const t = ts / 1000

    // FPS 统计（每 0.5s 更新一次显示）
    frameCount++
    const now = performance.now()
    if (now - fpsLast >= 500) {
        fps.value = Math.round(frameCount / ((now - fpsLast) / 1000))
        frameCount = 0
        fpsLast = now
    }

    // MVP = P * V * M（相机在 +z 看向原点；WebGPU 投影 z∈[0,1]）
    const model = options.value.rotate ? Mat4.multiply(rotY(t * 0.6), rotX(t * 0.4)) : Mat4.identity()
    const view = Mat4.translation(0, 0, -4)
    const projection = perspectiveZeroToOne(Math.PI / 3, SIZE / SIZE, 0.1, 100)
    const mvp = Mat4.multiply(projection, view).multiply(model)
    const pv = Mat4.multiply(projection, view) // 实例环不随立方体旋转

    // 上传 uniform（真实 GPU：queue.writeBuffer 或映射写入）
    device.queue.writeBuffer(mvpBuffer, 0, new Float32Array(mvp.m))
    device.queue.writeBuffer(pvBuffer, 0, new Float32Array(pv.m))

    // 每帧更新实例偏移：绕原点缓慢旋转的圆环（stepMode: instance）
    if (options.value.instanced) {
        const ang = t * 0.8
        for (let i = 0; i < INSTANCE_COUNT; i++) {
            const a = ang + (i / INSTANCE_COUNT) * Math.PI * 2
            instOffsets[i * 2] = Math.cos(a) * RING_RADIUS
            instOffsets[i * 2 + 1] = Math.sin(a) * RING_RADIUS
        }
        device.queue.writeBuffer(offsetsBuffer, 0, instOffsets)
    }

    // 编码命令 → 提交（真实 GPU：命令记录后统一执行）
    const texture = gpuCtx!.getCurrentTexture()
    const encoder = device.createCommandEncoder()
    const pass = encoder.beginRenderPass({
        colorAttachments: [
            { view: texture.createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0.05, 0.05, 0.08, 1] },
        ],
        depthStencilAttachment: {
            view: depthTex.createView(),
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
            depthClearValue: 1,
        },
    })

    // 1. 实例化三角形环（背景层，无需剔除）
    if (options.value.instanced) {
        pass.setPipeline(instPipeline)
        pass.setBindGroup(0, pvGroup)
        pass.setVertexBuffer(0, triBuffer)
        pass.setVertexBuffer(1, offsetsBuffer)
        pass.setVertexBuffer(2, colorsBuffer)
        pass.draw(3, INSTANCE_COUNT)
    }

    // 2. 实体立方体（深度测试 + 背面剔除固化在管线里）
    pass.setPipeline(cubePipeline)
    pass.setBindGroup(0, mvpGroup)
    pass.setVertexBuffer(0, cubeVertexBuffer)
    pass.setIndexBuffer(cubeIndexBuffer, 'uint16')
    pass.drawIndexed(36)

    // 3. 线框叠加（less-equal 保证与表面共面的边通过深度测试）
    if (options.value.wireframe) {
        pass.setPipeline(wirePipeline)
        pass.setBindGroup(0, mvpGroup)
        pass.setVertexBuffer(0, wireVertexBuffer)
        pass.draw(EDGES.length * 2)
    }

    pass.end()
    device.queue.submit([encoder.finish()])

    // 帧缓冲（纹理）→ canvas
    ctx2d!.putImageData(texture.toImageData(), 0, 0)
    raf = requestAnimationFrame(render)
}

onMounted(async () => {
    const canvas = canvasRef.value!
    canvas.width = SIZE * DPR
    canvas.height = SIZE * DPR
    canvas.style.width = `${SIZE}px`
    canvas.style.height = `${SIZE}px`
    ctx2d = canvas.getContext('2d')!

    // 1. adapter → device（真实 API：navigator.gpu.requestAdapter()）
    const adapter = await gpu.requestAdapter()
    device = await adapter.requestDevice()

    // 1.5 画布上下文：configure 后 getCurrentTexture() 得到渲染目标
    gpuCtx = gpu.getCanvasContext(canvas)
    gpuCtx.configure({ device, format: 'rgba8unorm', width: SIZE * DPR, height: SIZE * DPR })

    // 2. 创建缓冲（真实 API：GPUDevice.createBuffer）
    cubeVertexBuffer = device.createBuffer({ size: cubeVertices.byteLength, usage: BufferUsage.VERTEX })
    device.queue.writeBuffer(cubeVertexBuffer, 0, cubeVertices)
    cubeIndexBuffer = device.createBuffer({ size: cubeIndices.byteLength, usage: BufferUsage.INDEX })
    device.queue.writeBuffer(cubeIndexBuffer, 0, cubeIndices)
    wireVertexBuffer = device.createBuffer({ size: wireVertices.byteLength, usage: BufferUsage.VERTEX })
    device.queue.writeBuffer(wireVertexBuffer, 0, wireVertices)
    triBuffer = device.createBuffer({ size: instTriangle.byteLength, usage: BufferUsage.VERTEX })
    device.queue.writeBuffer(triBuffer, 0, instTriangle)
    offsetsBuffer = device.createBuffer({ size: instOffsets.byteLength, usage: BufferUsage.VERTEX | BufferUsage.COPY_DST })
    colorsBuffer = device.createBuffer({ size: instColors.byteLength, usage: BufferUsage.VERTEX })
    device.queue.writeBuffer(colorsBuffer, 0, instColors)
    mvpBuffer = device.createBuffer({ size: 64, usage: BufferUsage.UNIFORM })
    pvBuffer = device.createBuffer({ size: 64, usage: BufferUsage.UNIFORM })

    // 3. 深度附件（depth32float）
    depthTex = device.createTexture({ size: [SIZE * DPR, SIZE * DPR], format: 'depth32float', usage: BufferUsage.COPY_SRC })

    // 4. 渲染管线：状态全部固化（顶点布局 / 图元 / 剔除 / 深度）
    cubePipeline = device.createRenderPipeline({
        vertex: {
            module: device.createShaderModule({ code: cubeWGSL }),
            buffers: [
                {
                    arrayStride: 16, // pos3(float32) + color4(unorm8)
                    attributes: [
                        { shaderLocation: 0, offset: 0, format: 'float32x3' },
                        { shaderLocation: 1, offset: 12, format: 'unorm8x4' },
                    ],
                },
            ],
        },
        fragment: { module: device.createShaderModule({ code: cubeWGSL }), targets: [{ format: 'rgba8unorm' }] },
        primitive: { topology: 'triangle-list', cullMode: 'back', frontFace: 'ccw' },
        depthStencil: { format: 'depth32float', depthWriteEnabled: true, depthCompare: 'less' },
    })

    // 线框：不写深度 + less-equal，只画位置
    wirePipeline = device.createRenderPipeline({
        vertex: {
            module: device.createShaderModule({ code: wireWGSL }),
            buffers: [{ arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }] }],
        },
        fragment: { module: device.createShaderModule({ code: wireWGSL }), targets: [{ format: 'rgba8unorm' }] },
        primitive: { topology: 'line-list' },
        depthStencil: { format: 'depth32float', depthWriteEnabled: false, depthCompare: 'less-equal' },
    })

    // 实例化环：buffer0 = 顶点位置（每顶点），buffer1/2 = 偏移/颜色（每实例）
    instPipeline = device.createRenderPipeline({
        vertex: {
            module: device.createShaderModule({ code: instWGSL }),
            buffers: [
                { arrayStride: 8, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }] },
                { arrayStride: 8, stepMode: 'instance', attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x2' }] },
                { arrayStride: 16, stepMode: 'instance', attributes: [{ shaderLocation: 2, offset: 0, format: 'float32x4' }] },
            ],
        },
        fragment: { module: device.createShaderModule({ code: instWGSL }), targets: [{ format: 'rgba8unorm' }] },
        primitive: { topology: 'triangle-list', cullMode: 'none' },
        depthStencil: { format: 'depth32float', depthWriteEnabled: false, depthCompare: 'less' },
    })

    // 5. 绑定组：把 uniform buffer 按 binding 0 绑好
    mvpGroup = device.createBindGroup({ entries: [{ binding: 0, resource: mvpBuffer }] })
    pvGroup = device.createBindGroup({ entries: [{ binding: 0, resource: pvBuffer }] })

    gui = new GUI()
    gui.add(options.value, 'wireframe').name('线框')
    gui.add(options.value, 'rotate').name('旋转')
    gui.add(options.value, 'instanced').name('实例化')

    raf = requestAnimationFrame(render)
})

onBeforeUnmount(() => {
    cancelAnimationFrame(raf)
    gui?.destroy()
})
</script>

<template>
    <div class="demo">
        <div class="toolbar">
            <span class="fps">FPS: {{ fps }}</span>
        </div>
        <canvas ref="canvasRef"></canvas>
        <p>WebGPU：3D 立方体（不可变管线 + 深度/剔除 + unorm 顶点格式）+ 线框 + stepMode 实例化三角形环</p>
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
</style>
