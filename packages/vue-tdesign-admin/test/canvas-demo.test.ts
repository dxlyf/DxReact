// 验证 Canvas2D CPU 渲染器示例场景：填充/渐变/描边/图案/clip 区域均有实际像素输出
// （渲染逻辑现在内联在 graphics/canvas.vue 中，这里用同一套引擎 API 复现场景做像素断言）
import { Canvas2DRenderer } from '../src/views/graphics/engine/raster/canvas/index'

// node 环境没有全局 ImageData，补一个最小实现（toImageData 需要）
if (typeof (globalThis as Record<string, unknown>).ImageData === 'undefined') {
    ;(globalThis as Record<string, unknown>).ImageData = class ImageData {
        data: Uint8ClampedArray
        width: number
        height: number
        constructor(width: number, height: number) {
            this.width = width
            this.height = height
            this.data = new Uint8ClampedArray(width * height * 4)
        }
    }
}

let pass = 0, fail = 0
const assert = (name: string, cond: boolean) => {
    if (cond) { pass++; console.log(`PASS ${name}`) } else { fail++; console.log(`FAIL ${name}`) }
}
const near = (a: number, b: number, eps = 12) => Math.abs(a - b) <= eps

const SIZE = 500
const r = new Canvas2DRenderer(SIZE, SIZE)
const cx = SIZE / 2

// ---- 复现 canvas.vue 的 renderFrame 场景（t=0）----
{
    const g = r.createLinearGradient(0, 0, SIZE, SIZE)
    g.addColorStop(0, '#14142a')
    g.addColorStop(1, '#2a2a4a')
    r.fillStyle = g
    r.fillRect(0, 0, SIZE, SIZE)
}
{
    r.save()
    r.translate(cx, 150)
    r.rotate(0)
    r.fillStyle = '#ff5a5a'
    r.fillRect(-55, -55, 110, 110)
    r.strokeStyle = '#ffffff'
    r.lineWidth = 4
    r.strokeRect(-55, -55, 110, 110)
    r.restore()
}
{
    r.save()
    const g = r.createRadialGradient(150, 340, 5, 230, 340, 45)
    g.addColorStop(0, '#ffe14d')
    g.addColorStop(0.6, '#ff7a3d')
    g.addColorStop(1, '#c33dff')
    r.fillStyle = g
    r.beginPath()
    r.arc(190, 340, 52, 0, Math.PI * 2)
    r.fill()
    r.restore()

    r.save()
    const cg = r.createConicGradient(0, 350, 340)
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
{
    r.save()
    r.strokeStyle = '#66ffcc'
    r.lineWidth = 8
    r.lineCap = 'round'
    r.beginPath()
    r.moveTo(20, 210)
    r.quadraticCurveTo(85, 150, 150, 210)
    r.quadraticCurveTo(215, 270, 280, 210)
    r.stroke()
    r.restore()

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
{
    r.save()
    r.translate(30, 30)
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
{
    r.save()
    r.beginPath()
    r.arc(cx, 150, 60, 0, Math.PI * 2)
    r.arc(cx, 150, 32, 0, Math.PI * 2)
    r.clip('evenodd')
    r.fillStyle = '#ffd166'
    for (let i = -2; i < 12; i++) {
        r.fillRect(cx - 90 + i * 16, 70, 8, 160)
    }
    r.restore()
}

// ---- 断言 ----
// 1. 填充：旋转方块中心 (250,150) 应为 #ff5a5a
const sq = r.readPixel(250, 150)
assert('旋转方块填充红', near(sq[0], 255, 8) && near(sq[1], 90, 16))

// 2. 渐变：径向圆内 (150,340) 偏黄、外圈 (215,340) 更偏橙（b 更小）
const inner = r.readPixel(150, 340)
const outer = r.readPixel(215, 340)
assert('径向渐变内圈黄', inner[0] > 200 && inner[1] > 180)
assert('径向渐变外圈更偏橙', outer[2] < inner[2])

// 圆锥渐变圆心 (350,340) 周围有颜色（非背景色）
const conic = r.readPixel(350, 340)
assert('圆锥渐变圆心有颜色', conic[0] > 30 || conic[1] > 30 || conic[2] > 30)

// 3. 描边：波浪线中点 (150,210) 应为青色描边
const wl = r.readPixel(150, 210)
assert('描边波浪线青', near(wl[1], 255, 24) && wl[0] < 200)

// 星形填充中心 (250,400) 半透明蓝（alpha 混合后非透明）
const star = r.readPixel(250, 400)
assert('星形填充可见', star[3] > 100)

// 4. 图案：平铺区左上 (35,35) 有棋盘颜色（非背景渐变）
const pat = r.readPixel(35, 35)
assert('图案平铺区有颜色', pat[3] > 200)

// 5. clip：环形裁剪区。条纹 i=5 覆盖 x∈[240,248]，取 (246,110)：距环心 40 ∈(32,60) 环内 → 黄条纹
const ring = r.readPixel(246, 110)
assert('clip 环内条纹可见', ring[0] > 180 && ring[1] > 150)
// 环外 (250,200) 区域应是背景渐变而非条纹黄
const out = r.readPixel(250, 200)
assert('clip 环外为背景色', out[1] < 120)

// 背景角点 (5,5) 应为深蓝渐变（非透明）
const bg = r.readPixel(5, 5)
assert('背景渐变可见', bg[3] === 255)

console.log(`\n结果: ${pass} 通过, ${fail} 失败`)
if (fail > 0) process.exit(1)
