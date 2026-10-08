<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, shallowRef } from 'vue'
import { glMatrix } from '@dxyl/math2'
import { Context } from './engine/renderer/webgl/context'

/** 画布尺寸（最终输出） */
const CANVAS_WIDTH = 640
const CANVAS_HEIGHT = 480
/** 离屏渲染目标尺寸：把渲染帧作为纹理的来源 */
const FBO_SIZE = 512
/** 立方体索引数：6 面 x 2 三角形 x 3 顶点 */
const CUBE_INDEX_COUNT = 36
/** 地面半边长与 UV 平铺次数 */
const GROUND_HALF = 4
const GROUND_TILE = 4

/** 静态相机 */
const CAMERA_POSITION = new Float32Array([0, 2.4, 6.2])
const CAMERA_TARGET: [number, number, number] = [0, 0.7, 0]
const CAMERA_UP: [number, number, number] = [0, 1, 0]
/** 固定光照方向（世界空间），各 program 同名 uniform */
const LIGHT_DIR: [number, number, number] = [0.4, 0.9, 0.35]

/* ------------------------------------------------------------------
 * 着色器：GLSL ES 3.00
 * 注意：源码字符串内只能出现 ASCII 字符（不能用中文注释）；
 * 且每个 setUniform 的 uniform 都必须在着色器中真实使用，否则会被优化掉。
 * ------------------------------------------------------------------ */

/** 纯色立方体 */
const SOLID_VS = `#version 300 es
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
uniform mat4 uViewProj;
uniform mat4 uModel;
out vec3 vNormal;
void main() {
    vNormal = mat3(uModel) * aNormal;
    gl_Position = uViewProj * uModel * vec4(aPosition, 1.0);
}
`

const SOLID_FS = `#version 300 es
precision highp float;
uniform vec4 uColor;
uniform vec3 uLightDir;
in vec3 vNormal;
out vec4 fragColor;
void main() {
    vec3 normal = normalize(vNormal);
    float lambert = clamp(dot(normal, normalize(uLightDir)), 0.0, 1.0);
    fragColor = vec4(uColor.rgb * (0.4 + 0.6 * lambert), uColor.a);
}
`

/** 纹理立方体与地面共用：uAlbedo 由外部绑定（棋盘格 / FBO 渲染帧纹理） */
const TEXTURED_VS = `#version 300 es
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aUV;
uniform mat4 uViewProj;
uniform mat4 uModel;
out vec3 vNormal;
out vec2 vUV;
void main() {
    vNormal = mat3(uModel) * aNormal;
    vUV = aUV;
    gl_Position = uViewProj * uModel * vec4(aPosition, 1.0);
}
`

const TEXTURED_FS = `#version 300 es
precision highp float;
uniform sampler2D uAlbedo;
uniform vec4 uTint;
uniform vec3 uLightDir;
in vec3 vNormal;
in vec2 vUV;
out vec4 fragColor;
void main() {
    vec3 albedo = texture(uAlbedo, vUV).rgb;
    vec3 normal = normalize(vNormal);
    float lambert = clamp(dot(normal, normalize(uLightDir)), 0.0, 1.0);
    vec3 color = albedo * uTint.rgb * (0.4 + 0.6 * lambert);
    fragColor = vec4(color, uTint.a);
}
`

/** 离屏图案：全屏四边形绘制动态图案，结果写入 FBO 成为纹理 */
const PATTERN_VS = `#version 300 es
layout(location = 0) in vec2 aPosition;
layout(location = 1) in vec2 aUV;
out vec2 vUV;
void main() {
    vUV = aUV;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

const PATTERN_FS = `#version 300 es
precision highp float;
uniform float uTime;
in vec2 vUV;
out vec4 fragColor;
void main() {
    vec2 p = vUV * 2.0 - 1.0;
    float r = length(p);
    float a = atan(p.y, p.x);
    float stripes = 0.5 + 0.5 * sin(a * 8.0 + uTime * 2.0);
    float rings = 0.5 + 0.5 * sin(r * 18.0 - uTime * 3.0);
    vec3 color = mix(vec3(0.06, 0.35, 0.78), vec3(0.96, 0.55, 0.16), stripes);
    color *= 0.6 + 0.4 * rings;
    color *= smoothstep(1.0, 0.15, r);
    fragColor = vec4(color, 1.0);
}
`

/* ------------------------------------------------------------------
 * 几何与纹理数据
 * ------------------------------------------------------------------ */

/** 立方体：24 顶点（每面 4 个，位置 + 法线 + UV 交错），绕序逆时针朝外 */
function createCubeGeometry() {
    const faces: { normal: number[]; corners: number[][] }[] = [
        { normal: [1, 0, 0], corners: [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]] },
        { normal: [-1, 0, 0], corners: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]] },
        { normal: [0, 1, 0], corners: [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]] },
        { normal: [0, -1, 0], corners: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]] },
        { normal: [0, 0, 1], corners: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]] },
        { normal: [0, 0, -1], corners: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]] },
    ]
    const uvs = [[0, 0], [1, 0], [1, 1], [0, 1]]
    const vertices: number[] = []
    const indices: number[] = []
    faces.forEach((face, f) => {
        face.corners.forEach((corner, c) => {
            vertices.push(
                corner[0], corner[1], corner[2],
                face.normal[0], face.normal[1], face.normal[2],
                uvs[c][0], uvs[c][1],
            )
        })
        const base = f * 4
        indices.push(base, base + 1, base + 2, base, base + 2, base + 3)
    })
    return { vertices: new Float32Array(vertices), indices: new Uint16Array(indices) }
}

/** 地面：单个四边形，法线朝上 +Y，UV 平铺以配合 REPEAT */
function createGroundGeometry() {
    const h = GROUND_HALF
    const t = GROUND_TILE
    const vertices = new Float32Array([
        -h, 0, -h, 0, 1, 0, 0, 0,
        -h, 0, h, 0, 1, 0, 0, t,
        h, 0, h, 0, 1, 0, t, t,
        h, 0, -h, 0, 1, 0, t, 0,
    ])
    const indices = new Uint16Array([0, 1, 2, 0, 2, 3])
    return { vertices, indices }
}

/** 全屏四边形：位置(xy) + UV(uv) 交错 */
function createQuadGeometry() {
    return new Float32Array([
        -1, -1, 0, 0,
        1, -1, 1, 0,
        1, 1, 1, 1,
        -1, 1, 0, 1,
    ])
}

/** 棋盘格像素数据（地面与纹理立方体共用） */
function createCheckerPixels(size: number, cell: number) {
    const data = new Uint8Array(size * size * 4)
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const light = (Math.floor(x / cell) + Math.floor(y / cell)) % 2 === 0
            const index = (y * size + x) * 4
            data[index] = light ? 232 : 58
            data[index + 1] = light ? 234 : 62
            data[index + 2] = light ? 240 : 76
            data[index + 3] = 255
        }
    }
    return data
}

/* ------------------------------------------------------------------
 * 场景资源：program / 纹理 / 几何 / 帧缓冲
 * ------------------------------------------------------------------ */

function createScene(ctx: Context) {
    const solidProgram = ctx.createProgram({ vs: SOLID_VS, fs: SOLID_FS })
    const texturedProgram = ctx.createProgram({ vs: TEXTURED_VS, fs: TEXTURED_FS })
    const patternProgram = ctx.createProgram({ vs: PATTERN_VS, fs: PATTERN_FS })

    // 棋盘格纹理（地面 + 纹理立方体共用）
    const checkerTexture = ctx.createDataTexture(createCheckerPixels(64, 8), 64, 64, {
        minFilter: 'LINEAR_MIPMAP_LINEAR',
        magFilter: 'LINEAR',
        wrapS: 'REPEAT',
        wrapT: 'REPEAT',
        generateMipmaps: true,
    })

    // 离屏颜色纹理：作为 FBO 的颜色附件，随后被当作采样纹理使用
    const frameTexture = ctx.createTexture2D({
        minFilter: 'LINEAR',
        magFilter: 'LINEAR',
        wrapS: 'CLAMP_TO_EDGE',
        wrapT: 'CLAMP_TO_EDGE',
    })
    frameTexture.setSize(FBO_SIZE, FBO_SIZE)

    const fbo = ctx.createFrameBuffer()
    fbo.attachTexture('COLOR_ATTACHMENT0', frameTexture)
    fbo.setDrawBuffers(['COLOR_ATTACHMENT0'])
    fbo.checkStatus()

    // 立方体几何（位置 0 / 法线 1 / UV 2）
    const cubeGeometry = createCubeGeometry()
    const cubeAttr = ctx.createAttributeBuffer({
        attributes: [
            { name: 'aPosition', size: 3, location: 0 },
            { name: 'aNormal', size: 3, location: 1 },
            { name: 'aUV', size: 2, location: 2 },
        ],
    })
    cubeAttr.setData(cubeGeometry.vertices)
    const cubeIndex = ctx.createIndexBuffer()
    cubeIndex.setData(cubeGeometry.indices)

    // 地面几何
    const groundGeometry = createGroundGeometry()
    const groundAttr = ctx.createAttributeBuffer({
        attributes: [
            { name: 'aPosition', size: 3, location: 0 },
            { name: 'aNormal', size: 3, location: 1 },
            { name: 'aUV', size: 2, location: 2 },
        ],
    })
    groundAttr.setData(groundGeometry.vertices)
    const groundIndex = ctx.createIndexBuffer()
    groundIndex.setData(groundGeometry.indices)

    // 全屏四边形（位置 0 / UV 1），用于离屏图案绘制
    const quadAttr = ctx.createAttributeBuffer({
        attributes: [
            { name: 'aPosition', size: 2, location: 0 },
            { name: 'aUV', size: 2, location: 1 },
        ],
    })
    quadAttr.setData(createQuadGeometry())

    return {
        solidProgram,
        texturedProgram,
        patternProgram,
        checkerTexture,
        frameTexture,
        fbo,
        cubeAttr,
        cubeIndex,
        groundAttr,
        groundIndex,
        quadAttr,
    }
}

/* ------------------------------------------------------------------
 * 组件状态与渲染循环
 * ------------------------------------------------------------------ */

const canvasRef = shallowRef<HTMLCanvasElement>()

const state = reactive({
    autoRotate: true,
    contextLost: false,
    fps: 0,
})

const info = reactive({
    maxTextureUnits: 0,
    maxTextureSize: 0,
})

let ctx: Context | null = null
let scene: ReturnType<typeof createScene> | null = null
let loseContextExt: WEBGL_lose_context | null = null
let rafId = 0
let previousTime = 0
let frameCount = 0
let fpsAccumulator = 0

// 相机与每帧矩阵（复用同一批数组，避免每帧分配）
const projection = glMatrix.mat4.create()
const view = glMatrix.mat4.create()
const viewProj = glMatrix.mat4.create()
const groundModel = glMatrix.mat4.create()
const model = glMatrix.mat4.create()
const translation = glMatrix.mat4.create()

/** 构造 T * R * S：绕 Y 旋转 rotationY、缩放 scaleValue，再平移到 (x, y, z) */
function buildModel(x: number, y: number, z: number, rotationY: number, scaleValue: number) {
    glMatrix.mat4.fromYRotation(model, rotationY)
    glMatrix.mat4.scale(model, model, [scaleValue, scaleValue, scaleValue])
    glMatrix.mat4.fromTranslation(translation, [x, y, z])
    glMatrix.mat4.multiply(model, translation, model)
    return model
}

function render(now: number) {
    rafId = requestAnimationFrame(render)
    const context = ctx
    const objects = scene
    if (!context || !objects) {
        return
    }
    if (state.contextLost) {
        previousTime = now
        return
    }

    const time = now * 0.001
    const delta = previousTime === 0 ? 0 : time - previousTime
    previousTime = time

    // FPS 统计（每 0.5s 刷新一次）
    frameCount++
    fpsAccumulator += delta
    if (fpsAccumulator >= 0.5) {
        state.fps = Math.round(frameCount / fpsAccumulator)
        frameCount = 0
        fpsAccumulator = 0
    }

    const spin = state.autoRotate ? time : 0

    // ---------- Pass 1：把动态图案渲染到 FBO（渲染帧 -> 纹理） ----------
    objects.fbo.bind()
    context.viewport(0, 0, FBO_SIZE, FBO_SIZE)
    context.disable('DEPTH_TEST')
    context.disable('CULL_FACE')
    context.disable('BLEND')
    context.clear({ color: [0, 0, 0, 1] })

    objects.patternProgram.use()
    objects.patternProgram.setUniform1f('uTime', time)
    objects.quadAttr.bind()
    context.drawArray('TRIANGLE_STRIP', 0, objects.quadAttr.count)

    // ---------- Pass 2：主场景渲染到画布 ----------
    objects.fbo.unbind()
    context.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    context.enable('DEPTH_TEST')
    context.depthFunc('LEQUAL')
    context.depthMask(true)
    context.enable('CULL_FACE')
    context.cullFace('BACK')
    context.frontFace('CCW')
    context.disable('BLEND')
    context.clear({ color: [0.05, 0.06, 0.09, 1], depth: 1 })

    const vp = new Float32Array(viewProj)

    // 地面（棋盘格纹理）
    objects.texturedProgram.use()
    objects.texturedProgram.setUniformMat4fv('uViewProj', false, vp)
    objects.texturedProgram.setUniformMat4fv('uModel', false, new Float32Array(groundModel))
    objects.texturedProgram.setUniform4f('uTint', 0.8, 0.85, 0.92, 1.0)
    objects.texturedProgram.setUniform3f('uLightDir', LIGHT_DIR[0], LIGHT_DIR[1], LIGHT_DIR[2])
    objects.checkerTexture.bind(0)
    objects.texturedProgram.setUniform1i('uAlbedo', 0)
    objects.groundAttr.bind()
    objects.groundIndex.bind()
    context.drawElements('TRIANGLES', 6, 'UNSIGNED_SHORT', 0)

    // 立方体 1：纯色
    objects.solidProgram.use()
    objects.solidProgram.setUniformMat4fv('uViewProj', false, vp)
    objects.solidProgram.setUniformMat4fv('uModel', false, new Float32Array(buildModel(-1.7, 0.8, 0, spin * 0.6, 0.8)))
    objects.solidProgram.setUniform4f('uColor', 0.86, 0.45, 0.2, 1.0)
    objects.solidProgram.setUniform3f('uLightDir', LIGHT_DIR[0], LIGHT_DIR[1], LIGHT_DIR[2])
    objects.cubeAttr.bind()
    objects.cubeIndex.bind()
    context.drawElements('TRIANGLES', CUBE_INDEX_COUNT, 'UNSIGNED_SHORT', 0)

    // 立方体 2：棋盘格纹理
    objects.texturedProgram.use()
    objects.texturedProgram.setUniformMat4fv('uViewProj', false, vp)
    objects.texturedProgram.setUniformMat4fv('uModel', false, new Float32Array(buildModel(0, 0.8, 0, spin * 0.4 + 0.6, 0.8)))
    objects.texturedProgram.setUniform4f('uTint', 1.0, 1.0, 1.0, 1.0)
    objects.texturedProgram.setUniform3f('uLightDir', LIGHT_DIR[0], LIGHT_DIR[1], LIGHT_DIR[2])
    objects.checkerTexture.bind(0)
    objects.texturedProgram.setUniform1i('uAlbedo', 0)
    objects.cubeAttr.bind()
    objects.cubeIndex.bind()
    context.drawElements('TRIANGLES', CUBE_INDEX_COUNT, 'UNSIGNED_SHORT', 0)

    // 立方体 3：纹理来自 FBO 渲染帧
    objects.texturedProgram.use()
    objects.texturedProgram.setUniformMat4fv('uViewProj', false, vp)
    objects.texturedProgram.setUniformMat4fv('uModel', false, new Float32Array(buildModel(1.7, 0.8, 0, spin * 0.5 - 0.6, 0.8)))
    objects.texturedProgram.setUniform4f('uTint', 1.0, 1.0, 1.0, 1.0)
    objects.texturedProgram.setUniform3f('uLightDir', LIGHT_DIR[0], LIGHT_DIR[1], LIGHT_DIR[2])
    objects.frameTexture.bind(0)
    objects.texturedProgram.setUniform1i('uAlbedo', 0)
    objects.cubeAttr.bind()
    objects.cubeIndex.bind()
    context.drawElements('TRIANGLES', CUBE_INDEX_COUNT, 'UNSIGNED_SHORT', 0)
}

function loseContext() {
    loseContextExt?.loseContext()
}

function restoreContext() {
    loseContextExt?.restoreContext()
}

onMounted(() => {
    const canvas = canvasRef.value
    if (!canvas) {
        return
    }
    const gl = canvas.getContext('webgl2')
    if (!gl) {
        return
    }

    const context = new Context(gl)
    ctx = context
    loseContextExt = gl.getExtension('WEBGL_lose_context')

    context.on('contextlost', () => {
        state.contextLost = true
    })
    context.on('contextrestored', () => {
        state.contextLost = false
    })

    info.maxTextureUnits = context.capabilities.maxTextureUnits
    info.maxTextureSize = context.capabilities.maxTextureSize

    // 相机矩阵只需构建一次（相机固定）
    glMatrix.mat4.perspectiveNO(projection, (45 * Math.PI) / 180, CANVAS_WIDTH / CANVAS_HEIGHT, 0.1, 100)
    glMatrix.mat4.lookAt(view, CAMERA_POSITION, CAMERA_TARGET, CAMERA_UP)
    glMatrix.mat4.multiply(viewProj, projection, view)
    glMatrix.mat4.identity(groundModel)

    scene = createScene(context)
    rafId = requestAnimationFrame(render)
})

onBeforeUnmount(() => {
    cancelAnimationFrame(rafId)
    ctx?.dispose()
    ctx = null
    scene = null
    loseContextExt = null
})
</script>

<template>
    <div class="webgl-demo">
        <canvas ref="canvasRef" :width="CANVAS_WIDTH" :height="CANVAS_HEIGHT"></canvas>

        <div class="panel">
            <label><input v-model="state.autoRotate" type="checkbox" /> 自动旋转</label>
            <button type="button" @click="loseContext">模拟上下文丢失</button>
            <button type="button" @click="restoreContext">恢复上下文</button>
        </div>

        <div class="info">
            <span>FPS：{{ state.fps }}</span>
            <span>纹理单元上限：{{ info.maxTextureUnits }}</span>
            <span>纹理尺寸上限：{{ info.maxTextureSize }}</span>
            <span :class="{ lost: state.contextLost }">
                {{ state.contextLost ? '上下文已丢失（资源已销毁）' : '上下文正常' }}
            </span>
        </div>
    </div>
</template>

<style scoped>
.webgl-demo {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
    padding: 16px;
}

.webgl-demo canvas {
    background: #05060a;
    border: 1px solid #2a2f3a;
    border-radius: 6px;
}

.panel {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 20px;
    align-items: center;
    color: #333;
    font-size: 13px;
}

.panel label {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    cursor: pointer;
}

.panel button {
    padding: 4px 12px;
    border: 1px solid #c4c8d0;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
}

.info {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    color: #666;
    font-size: 12px;
}

.info .lost {
    color: #d14343;
    font-weight: 600;
}
</style>
