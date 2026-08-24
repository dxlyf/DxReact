<script setup lang="ts">
/**
 * Canvas2D CPU 渲染器示例 —— 填充 / 渐变 / 描边 / 图案 / 裁剪。
 *
 * 与 gpu.vue（WebGPU 对象模型）不同，这里是"类 canvas 2D 的立即模式矢量光栅化"：
 *   1. 路径 = 用户坐标命令序列，渲染时用 2D 仿射矩阵变换到设备坐标
 *   2. 填充 = 扫描线算法（nonzero / evenodd 判内外）
 *   3. 描边 = 把折线"膨胀"成多边形（线段矩形 + 端帽 + join），复用填充管线
 *   4. 颜色 = 纯色 / 线性 / 径向（双圆心）/ 圆锥渐变 / 图案平铺
 *   5. clip = 射线法裁剪判定，save/restore 恢复
 *
 * 每帧用 requestAnimationFrame 在 CPU 软件光栅化后端上重绘，
 * 再 putImageData 到显示 canvas —— 绘制时序与真 GPU 完全一致，
 * 仅渲染后端从 GPU 换成纯 JS 扫描线填充。
 */
import { shallowRef, onMounted, onBeforeUnmount } from 'vue'
import { Canvas2DRenderer } from './engine/raster/canvas'

const canvasRef = shallowRef<HTMLCanvasElement>()
const SIZE = 500
let raf = 0
/** CPU 渲染器：与显示 canvas 同为 SIZE*DPR 物理像素，挂载时创建一次、每帧复用 */
let renderer: Canvas2DRenderer | null = null

/** 渲染一帧到 CPU 帧缓冲并 putImageData 到显示 canvas（复用 renderer，先清空再重绘） */
function renderFrame(ctx2d: CanvasRenderingContext2D, t: number): void {
    const r = renderer!
    r.clear()
    const cx = SIZE / 2

    // ---- 背景：线性渐变 ----
    {
        const g = r.createLinearGradient(0, 0, SIZE, SIZE)
        g.addColorStop(0, '#14142a')
        g.addColorStop(1, '#2a2a4a')
        r.fillStyle = g
        r.fillRect(0, 0, SIZE, SIZE)
    }

    // ---- 1. 填充：旋转的正方形（纯色 + 变换） ----
    {
        r.save()
        r.translate(cx, 150)
        r.rotate(t * 0.5)
        r.fillStyle = '#ff5a5a'
        r.fillRect(-55, -55, 110, 110)
        r.strokeStyle = '#ffffff'
        r.lineWidth = 4
        r.strokeRect(-55, -55, 110, 110)
        r.restore()
    }

    // ---- 2. 渐变：径向（双圆心）+ 圆锥 ----
    {
        // 径向：内圆(150,340,5) → 外圆(230,340,45)，随 t 轻微摆动圆心
        r.save()
        const px = 150 + Math.sin(t * 0.8) * 15
        const g = r.createRadialGradient(px, 340, 5, 230, 340, 45)
        g.addColorStop(0, '#ffe14d')
        g.addColorStop(0.6, '#ff7a3d')
        g.addColorStop(1, '#c33dff')
        r.fillStyle = g
        r.beginPath()
        r.arc(190, 340, 52, 0, Math.PI * 2)
        r.fill()
        r.restore()

        // 圆锥：彩虹色绕圆心旋转
        r.save()
        const cg = r.createConicGradient(t, 350, 340)
        cg.addColorStop(0, '#ff0000')
        cg.addColorStop(0.17, '#ffff00')
        cg.addColorStop(0.33, '#00ff00')
        cg.addColorStop(0.5, '#00ffff')
        cg.addColorStop(0.67, '#0000ff')
        cg.addColorStop(0.83, '#ff00ff')
        cg.addColorStop(1, '#ff0000')
        r.fillStyle = cg
        r.beginPath()
        r.arc(350, 340, 50, 0, Math.PI * 2)
        r.fill()
        r.restore()
    }

    // ---- 3. 描边：开放路径（round cap）+ 闭合星形 ----
    {
        r.save()
        // 开放的波浪线（二次贝塞尔）
        r.strokeStyle = '#66ffcc'
        r.lineWidth = 8
        r.lineCap = 'round'
        r.beginPath()
        r.moveTo(20, 210)
        r.quadraticCurveTo(85, 150, 150, 210)
        r.quadraticCurveTo(215, 270, 280, 210)
        r.stroke()
        r.restore()

        // 星形（描边 + 半透明填充，验证 nonzero 自相交）
        r.save()
        r.translate(cx, 400)
        r.fillStyle = 'rgba(90, 200, 255, 0.45)'
        r.strokeStyle = '#5ac8ff'
        r.lineWidth = 3
        r.beginPath()
        const spikes = 5
        for (let i = 0; i < spikes * 2; i++) {
            const rad = i % 2 === 0 ? 70 : 30
            const a = -Math.PI / 2 + (i / (spikes * 2)) * Math.PI * 2
            const x = Math.cos(a) * rad
            const y = Math.sin(a) * rad
            if (i === 0) r.moveTo(x, y)
            else r.lineTo(x, y)
        }
        r.closePath()
        r.fill()
        r.stroke()
        r.restore()
    }

    // ---- 4. 图案平铺（带 transform） ----
    {
        r.save()
        r.translate(30, 30)
        // 8x8 网格图：红蓝棋盘 → 平铺成网格纸
        const cell = 8
        const grid = new Array(cell * cell * 4).fill(0)
        for (let y = 0; y < cell; y++) {
            for (let x = 0; x < cell; x++) {
                const i = (y * cell + x) * 4
                const check = (x + y) % 2 === 0
                grid[i] = check ? 255 : 40
                grid[i + 1] = check ? 80 : 120
                grid[i + 2] = check ? 120 : 255
                grid[i + 3] = 255
            }
        }
        const pat = r.createPattern({ width: cell, height: cell, data: new Uint8ClampedArray(grid) }, 'repeat')
        r.fillStyle = pat
        r.beginPath()
        r.rect(0, 0, 130, 130)
        r.fill()
        r.strokeStyle = 'rgba(255,255,255,0.6)'
        r.lineWidth = 2
        r.strokeRect(0, 0, 130, 130)
        r.restore()
    }

    // ---- 5. clip：环形裁剪区（evenodd 挖洞） ----
    {
        r.save()
        r.beginPath()
        r.arc(cx, 150, 60, 0, Math.PI * 2)
        r.arc(cx, 150, 32, 0, Math.PI * 2)
        r.clip('evenodd')
        // 只有环内可见的条纹
        r.fillStyle = '#ffd166'
        for (let i = -2; i < 12; i++) {
            r.fillRect(cx - 90 + i * 16, 70, 8, 160)
        }
        r.restore()
    }

    // ---- 导出到显示 canvas ----
    ctx2d.putImageData(r.toImageData(), 0, 0)
}

onMounted(() => {
    const canvas = canvasRef.value!
    const DPR = window.devicePixelRatio || 1
    canvas.width = SIZE * DPR
    canvas.height = SIZE * DPR
    canvas.style.width = `${SIZE}px`
    canvas.style.height = `${SIZE}px`
    const ctx2d = canvas.getContext('2d')!

    // 渲染器按物理像素创建，scale(DPR) 后绘制逻辑坐标仍为 500×500（与 canvas 样式一致）
    renderer = new Canvas2DRenderer(SIZE * DPR, SIZE * DPR)
    renderer.scale(DPR, DPR)

    const loop = (ts: number) => {
        renderFrame(ctx2d, ts / 1000)
        raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
})
onBeforeUnmount(() => {
    cancelAnimationFrame(raf)
    renderer = null
})
</script>

<template>
    <div class="demo">
        <canvas ref="canvasRef"></canvas>
        <p>Canvas2D CPU：扫描线填充 + 描边膨胀 + 三类渐变 + 图案平铺 + clip 环形裁剪（全部软件光栅化）</p>
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
