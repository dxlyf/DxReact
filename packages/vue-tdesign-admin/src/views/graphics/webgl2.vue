<script setup lang="ts">
/**
 * WebGL2 引擎演示 —— 交互式 3D 场景
 *
 * 展示引擎的典型用法：
 *   - Renderer：DPR 自适应 / 自动清屏 / 相机 UBO 每帧同步 / 默认 PBR-ish 材质
 *   - Geometry 内置网格：box / sphere / plane / lines
 *   - PerspectiveCamera + OrbitControls：拖拽旋转 / 右键平移 / 滚轮缩放
 *   - Mat4 组合模型矩阵做平移 + 自旋 / 公转动画
 */
import { onMounted, onBeforeUnmount, shallowRef, ref } from 'vue'
import {
    Renderer,
    PerspectiveCamera,
    OrbitControls,
    Geometry,
    Mat4,
} from '@/views/graphics/engine/renderer/webgl2'
import type { Geometry as GeometryType } from '@/views/graphics/engine/renderer/webgl2'

const canvasRef = shallowRef<HTMLCanvasElement>()
const fpsEl = ref<HTMLSpanElement>()
const webglError = ref('')

let renderer: Renderer | null = null
let controls: OrbitControls | null = null
let camera: PerspectiveCamera | null = null
let grid: GeometryType | null = null
let box: GeometryType | null = null
let sphere: GeometryType | null = null
let satellite: GeometryType | null = null
let raf = 0
let frameCount = 0
let accMs = 0
let lastStamp = performance.now()
const IDENTITY = Mat4.identity()

/** 生成网格线：一个 10×10 的地平网格（XZ 平面，y=0），坐标轴中线高亮 */
function makeGrid(gl: WebGL2RenderingContext): GeometryType {
    const E = 5
    const positions: number[] = []
    const colors: number[] = []
    const dim: [number, number, number] = [0.13, 0.2, 0.3]
    const accent: [number, number, number] = [0.24, 0.42, 0.62]
    const push = (x0: number, z0: number, x1: number, z1: number, c: [number, number, number]) => {
        positions.push(x0, 0, z0, x1, 0, z1)
        for (let i = 0; i < 2; i++) colors.push(c[0], c[1], c[2])
    }
    for (let i = -E; i <= E; i++) {
        const c = i === 0 ? accent : dim
        push(-E, i, E, i, c) // 沿 X 方向
        push(i, -E, i, E, c) // 沿 Z 方向
    }
    return Geometry.lines(gl, positions, colors)
}

/** 每帧绘制场景：网格 + 自旋的主立方体 + 公转的球 + 围绕公转的小方块 */
function drawScene(t: number): void {
    const r = renderer!
    r.draw(grid!, { uniforms: { u_model: IDENTITY } })

    // 中心：自旋的红色立方体（做轴旋转，直观体现法线光照）
    r.draw(box!, {
        uniforms: {
            u_model: Mat4.multiply(Mat4.translation(0, 0.6, 0), Mat4.rotationY(t * 0.7)),
            u_baseColor: [0.9, 0.25, 0.3, 1],
        },
    })

    // 蓝色球体：绕中心公转并上下浮动
    const ox = Math.sin(t * 0.5) * 2.4
    const oz = Math.cos(t * 0.5) * 2.4
    const oy = 0.95 + Math.sin(t * 0.9) * 0.3
    r.draw(sphere!, {
        uniforms: {
            u_model: Mat4.translation(ox, oy, oz),
            u_baseColor: [0.25, 0.5, 0.95, 1],
        },
    })

    // 绿色小方块：贴着球体绕转（公转 + 自旋 + 高度浮动）
    const a = t * 1.7
    const sx = Math.cos(a) * 1.15 + ox
    const sz = Math.sin(a) * 1.15 + oz
    const sy = oy + Math.sin(t * 2.6) * 0.3 + 0.15
    r.draw(satellite!, {
        uniforms: {
            u_model: Mat4.multiply(Mat4.translation(sx, sy, sz), Mat4.rotationY(a * 2)),
            u_baseColor: [0.35, 0.8, 0.45, 1],
        },
    })
}

function loop(ts: number): void {
    raf = requestAnimationFrame(loop)
    const t = ts / 1000
    controls?.update()
    renderer?.render(camera!, () => drawScene(t))

    // FPS 统计
    frameCount++
    accMs += ts - lastStamp
    lastStamp = ts
    if (accMs >= 500 && fpsEl.value) {
        fpsEl.value.textContent = `${Math.round((frameCount * 1000) / accMs)} FPS`
        frameCount = 0
        accMs = 0
    }
}

onMounted(() => {
    const canvas = canvasRef.value
    if (!canvas) return
    try {
        renderer = new Renderer(canvas)
        renderer.setClearColor(0.035, 0.05, 0.08, 1)
        camera = new PerspectiveCamera(60).setPosition(5.2, 4.2, 6).setTarget(0, 0.4, 0)
        controls = new OrbitControls(canvas, camera, {
            minDistance: 2,
            maxDistance: 40,
        })

        const gl = renderer.gl
        grid = makeGrid(gl)
        box = Geometry.box(gl)
        sphere = Geometry.sphere(gl, { radius: 0.75, widthSegments: 48, heightSegments: 24 })
        satellite = Geometry.box(gl, { width: 0.4, height: 0.4, depth: 0.4 })

        loop(performance.now())
    } catch (err) {
        webglError.value = err instanceof Error ? err.message : String(err)
        console.error(err)
    }
})

onBeforeUnmount(() => {
    cancelAnimationFrame(raf)
    controls?.dispose()
    renderer?.dispose()
    renderer = null
})
</script>

<template>
    <div class="demo-root">
        <canvas ref="canvasRef" class="demo-canvas"></canvas>

        <!-- 覆盖层（不拦截鼠标，保证 OrbitControls 可用） -->
        <div class="hud top-left">
            <div class="title">WebGL2 引擎 · 实时演示</div>
            <div class="sub">Renderer / Geometry / Camera / OrbitControls</div>
        </div>
        <div class="hud top-right"><span ref="fpsEl" class="fps">—</span></div>
        <div class="hud bottom-left hint">鼠标左键旋转 · 右键平移 · 滚轮缩放</div>

        <div v-if="webglError" class="hud error">WebGL2 初始化失败：{{ webglError }}</div>
    </div>
</template>

<style scoped>
.demo-root {
    position: relative;
    width: 100%;
    height: calc(100vh - 96px);
    min-height: 420px;
    background: #06080d;
    border-radius: 8px;
    overflow: hidden;
}
.demo-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    outline: none;
}
.hud {
    position: absolute;
    z-index: 1;
    pointer-events: none;
    user-select: none;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.85);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}
.top-left {
    top: 14px;
    left: 16px;
}
.title {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.3px;
}
.sub {
    margin-top: 3px;
    font-size: 12px;
    opacity: 0.65;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.top-right {
    top: 16px;
    right: 18px;
}
.fps {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 13px;
    opacity: 0.9;
}
.bottom-left {
    bottom: 12px;
    left: 16px;
    opacity: 0.6;
}
.hint {
    font-size: 12px;
}
.error {
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    color: #ff7875;
    background: rgba(20, 8, 8, 0.85);
    padding: 10px 16px;
    border-radius: 6px;
    max-width: 70%;
}
</style>
