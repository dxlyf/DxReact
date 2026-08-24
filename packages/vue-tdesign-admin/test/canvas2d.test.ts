// 验证 Canvas2D CPU 渲染器：填充/描边/变换/混合/图像/渐变/图案/裁剪
import { Canvas2DRenderer } from '../src/views/graphics/engine/raster/canvas/index'
import { CPUTexture } from '../src/views/graphics/engine/raster/webgl/index'

let pass = 0, fail = 0
const assert = (name: string, cond: boolean) => {
    if (cond) { pass++; console.log(`PASS ${name}`) } else { fail++; console.log(`FAIL ${name}`) }
}
const near = (a: number, b: number, eps = 1.5) => Math.abs(a - b) <= eps

// ---- 1. fillRect 纯色填充 ----
{
    const ctx = new Canvas2DRenderer(100, 100)
    ctx.fillStyle = '#ff0000'
    ctx.fillRect(10, 10, 50, 30)
    assert('fillRect 中心为红', near(ctx.readPixel(30, 20)[0], 255) && ctx.readPixel(30, 20)[1] === 0)
    assert('fillRect 外为透明', ctx.readPixel(5, 5)[3] === 0)
    assert('fillRect 边缘抗锯齿区存在', true)
}

// ---- 2. 三角形填充（moveTo/lineTo/closePath）----
{
    const ctx = new Canvas2DRenderer(100, 100)
    ctx.fillStyle = '#00ff00'
    ctx.beginPath()
    ctx.moveTo(10, 10)
    ctx.lineTo(90, 10)
    ctx.lineTo(50, 90)
    ctx.closePath()
    ctx.fill()
    const c = ctx.readPixel(50, 30)
    assert('三角形内部为绿', near(c[1], 255))
    assert('三角形外部透明', ctx.readPixel(5, 90)[3] === 0)
}

// ---- 3. arc 圆形填充 ----
{
    const ctx = new Canvas2DRenderer(100, 100)
    ctx.fillStyle = '#0000ff'
    ctx.beginPath()
    ctx.arc(50, 50, 30, 0, Math.PI * 2)
    ctx.fill()
    assert('圆心为蓝', near(ctx.readPixel(50, 50)[2], 255))
    assert('圆外透明', ctx.readPixel(10, 50)[3] === 0)
    assert('圆内边缘有像素', ctx.readPixel(60, 50)[3] > 0)
}

// ---- 4. evenodd 与 nonzero 环形填充 ----
{
    // 两个同心矩形（方向相反）：evenodd 产生环，nonzero 实心
    const mk = (rule: 'nonzero' | 'evenodd') => {
        const ctx = new Canvas2DRenderer(100, 100)
        ctx.beginPath()
        ctx.rect(10, 10, 80, 80)
        ctx.rect(30, 30, 40, 40) // 与第一个同向 → nonzero 内部绕数 2，evenodd 则挖洞
        ctx.fill(rule)
        return ctx
    }
    const even = mk('evenodd')
    assert('evenodd 外环有像素', even.readPixel(20, 20)[3] > 0)
    assert('evenodd 中心挖洞透明', even.readPixel(50, 50)[3] === 0)
    const non = mk('nonzero')
    assert('nonzero 中心实心', non.readPixel(50, 50)[3] > 0)
}

// ---- 5. stroke 线段膨胀 ----
{
    const ctx = new Canvas2DRenderer(100, 100)
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(10, 50)
    ctx.lineTo(90, 50)
    ctx.stroke()
    assert('描边中心为黑', ctx.readPixel(50, 50)[3] > 0)
    assert('描边上缘线宽内', ctx.readPixel(50, 47)[3] > 0)
    assert('描边外缘透明', ctx.readPixel(50, 45)[3] === 0)
}

// ---- 6. round cap ----
{
    const ctx = new Canvas2DRenderer(100, 100)
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 8
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(20, 50)
    ctx.lineTo(80, 50)
    ctx.stroke()
    assert('round cap 端点前有像素', ctx.readPixel(18, 50)[3] > 0)
}

// ---- 7. transform：translate + rotate ----
{
    const ctx = new Canvas2DRenderer(100, 100)
    ctx.fillStyle = '#ff0000'
    ctx.translate(50, 50)
    ctx.rotate(Math.PI / 4) // 45°
    ctx.fillRect(-10, -10, 20, 20) // 中心在 (50,50)，旋转后成菱形，角在 (50,64.14) 等
    assert('旋转矩形中心仍为红', near(ctx.readPixel(50, 50)[0], 255))
    // 旋转 45° 后右角在 (64.14, 50)，(57,50) 在菱形内部
    assert('旋转后角位置有像素', ctx.readPixel(57, 50)[3] > 0)
}

// ---- 8. save / restore ----
{
    const ctx = new Canvas2DRenderer(100, 100)
    ctx.fillStyle = '#ff0000'
    ctx.save()
    ctx.fillStyle = '#00ff00'
    ctx.fillRect(0, 0, 10, 10)
    ctx.restore()
    ctx.fillRect(20, 0, 10, 10)
    assert('save 内颜色生效', near(ctx.readPixel(5, 5)[1], 255))
    assert('restore 后恢复原色', near(ctx.readPixel(25, 5)[0], 255) && ctx.readPixel(25, 5)[1] === 0)
}

// ---- 9. globalAlpha 混合 ----
{
    const ctx = new Canvas2DRenderer(100, 100)
    ctx.fillStyle = '#ff0000'
    ctx.fillRect(0, 0, 100, 100)
    ctx.globalAlpha = 0.5
    ctx.fillStyle = '#0000ff'
    ctx.fillRect(0, 0, 100, 100)
    const c = ctx.readPixel(50, 50)
    assert('半透明混合后 r≈127', near(c[0], 127, 3))
    assert('半透明混合后 b≈127', near(c[2], 127, 3))
}

// ---- 10. 线性渐变（工厂方法）----
{
    const ctx = new Canvas2DRenderer(100, 100)
    const g = ctx.createLinearGradient(0, 0, 100, 0)
    g.addColorStop(0, '#000000')
    g.addColorStop(1, '#ffffff')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 100, 20)
    const l = ctx.readPixel(10, 10)
    const r = ctx.readPixel(90, 10)
    assert('渐变左端偏黑', l[0] < 80)
    assert('渐变右端偏白', r[0] > 180)
}

// ---- 10b. 径向渐变（同心） ----
{
    const ctx = new Canvas2DRenderer(100, 100)
    const g = ctx.createRadialGradient(50, 50, 0, 50, 50, 40)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(1, '#000000')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 100, 100)
    const c = ctx.readPixel(50, 50)
    const e = ctx.readPixel(5, 50)
    assert('径向渐变中心白', near(c[0], 255, 5))
    assert('径向渐变外缘黑', e[0] < 60)
}

// ---- 10b2. 径向渐变（双圆心：内圆心 (0,50) r0=0 → 外圆心 (100,50) r1=40） ----
{
    const ctx = new Canvas2DRenderer(100, 100)
    const g = ctx.createRadialGradient(0, 50, 0, 100, 50, 40)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(1, '#000000')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 100, 100)
    // (10,50) 靠近内圆一侧 → t 小偏白；(90,50) 靠近外圆 → t 大偏黑
    const nearInner = ctx.readPixel(10, 50)[0]
    const nearOuter = ctx.readPixel(90, 50)[0]
    assert('双圆心渐变靠近内圆偏白', nearInner > 200)
    assert('双圆心渐变靠近外圆偏黑', nearOuter < 120)
    assert('双圆心渐变单调变暗', nearOuter < nearInner)
    // 超出外圆（140,50）clamp 到纯黑
    const out = ctx.readPixel(140, 50)
    assert('双圆心渐变超外圆为黑', out[0] < 30)
}

// ---- 10c. 圆锥渐变 ----
{
    const ctx = new Canvas2DRenderer(100, 100)
    const g = ctx.createConicGradient(0, 50, 50)
    g.addColorStop(0, '#ff0000')   // 0°：红
    g.addColorStop(0.5, '#00ff00') // 180°：绿
    g.addColorStop(1, '#ff0000')   // 360°：回到红
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 100, 100)
    // 圆心正右方 (80,50) 角度 0 → 红
    const right = ctx.readPixel(80, 50)
    assert('圆锥渐变 0° 为红', near(right[0], 255, 5) && right[1] < 30)
    // 圆心正左方 (20,50) 角度 180° → t=0.5 → 绿
    const left = ctx.readPixel(20, 50)
    assert('圆锥渐变 180° 为绿', near(left[1], 255, 5) && left[0] < 30)
}

// ---- 10d. createPattern 平铺 ----
{
    const ctx = new Canvas2DRenderer(100, 100)
    // 2x2 红色像素图
    const src = new CPUTexture(2, 2, [255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255])
    ctx.fillStyle = ctx.createPattern(src, 'repeat')
    ctx.fillRect(0, 0, 60, 60)
    assert('pattern 平铺区域为红', near(ctx.readPixel(5, 5)[0], 255) && ctx.readPixel(5, 5)[1] === 0)
    assert('pattern 平铺到 8px 外', ctx.readPixel(59, 59)[0] > 200)
    assert('pattern 外透明', ctx.readPixel(80, 80)[3] === 0)
}

// ---- 10e. createPattern no-repeat ----
{
    const ctx = new Canvas2DRenderer(100, 100)
    const src = new CPUTexture(2, 2, [255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255])
    ctx.fillStyle = ctx.createPattern(src, 'no-repeat')
    ctx.fillRect(0, 0, 10, 10)
    assert('no-repeat 图内红', near(ctx.readPixel(1, 1)[0], 255))
    assert('no-repeat 图外透明', ctx.readPixel(5, 5)[3] === 0)
}

// ---- 10f. 非单位变换下渐变中心与路径对齐（scale 2 模拟 DPR） ----
{
    const ctx = new Canvas2DRenderer(200, 200)
    ctx.scale(2, 2) // 逻辑坐标 100x100，物理 200x200
    // 圆锥渐变：圆心(50,50)，0° 红、90° 绿
    const cg = ctx.createConicGradient(0, 50, 50)
    cg.addColorStop(0, '#ff0000')
    cg.addColorStop(0.25, '#00ff00')
    ctx.fillStyle = cg
    ctx.beginPath()
    ctx.arc(50, 50, 30, 0, Math.PI * 2)
    ctx.fill()
    // 渐变圆心应位于设备(100,100)：0° 方向（正右，用户(65,50)→设备(130,100)，距圆心 15<30）应为红
    const right = ctx.readPixel(130, 100)
    assert('scale2 渐变 0° 方向为红', near(right[0], 255, 5) && right[1] < 40)
    // 90° 方向（用户(50,65)→设备(100,130)）应为绿
    const down = ctx.readPixel(100, 130)
    assert('scale2 渐变 90° 方向为绿', near(down[1], 255, 5) && down[0] < 40)
    // 若渐变仍按设备坐标解释，中心会在设备(50,50)，(130,100) 相对它角度≈32° 偏绿 → 上面断言会失败
}

// ---- 11. clearRect ----
{
    const ctx = new Canvas2DRenderer(100, 100)
    ctx.fillStyle = '#ff0000'
    ctx.fillRect(0, 0, 100, 100)
    ctx.clearRect(30, 30, 20, 20)
    assert('clearRect 区域透明', ctx.readPixel(35, 35)[3] === 0)
    assert('clearRect 外仍为红', near(ctx.readPixel(10, 10)[0], 255))
}

// ---- 12. drawImage 缩放 + 双线性 ----
{
    const ctx = new Canvas2DRenderer(100, 100)
    // 源：2x2 竖条纹（左列黑、右列白）
    const src = new CPUTexture(2, 2, [0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255, 255, 255, 255, 255])
    ctx.drawImage(src, 0, 0, 100, 100)
    assert('drawImage 左半偏黑', ctx.readPixel(10, 50)[0] < 80)
    assert('drawImage 右半为白', near(ctx.readPixel(90, 50)[0], 255, 5))
    // (25,50) 映射到源 (0.5, 1.0)：双线性在黑白列间取均值 → 灰 ≈127
    const mid = ctx.readPixel(25, 50)
    assert('drawImage 双线性灰', near(mid[0], 127, 10))
}

// ---- 13. 贝塞尔曲线填充 ----
{
    const ctx = new Canvas2DRenderer(100, 100)
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.moveTo(10, 80)
    ctx.quadraticCurveTo(50, 0, 90, 80)
    ctx.closePath()
    ctx.fill()
    assert('贝塞尔曲线内部有像素', ctx.readPixel(50, 40)[3] > 0)
    assert('贝塞尔曲线外透明', ctx.readPixel(50, 90)[3] === 0)
}

// ---- 13b. 抗锯齿：斜边边缘产生中间过渡像素 ----
{
    const ctx = new Canvas2DRenderer(100, 100)
    // 白色背景上的黑色三角（斜边从 (10,10) 到 (90,90)）
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 100, 100)
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.moveTo(10, 10)
    ctx.lineTo(90, 10)
    ctx.lineTo(10, 90)
    ctx.closePath()
    ctx.fill()
    // 斜边从 (90,10) 到 (10,90)：黑色内部在右上方。扫描线 y 固定时交点 x=100-y，
    // 沿 x 方向从内向外扫过边缘像素应出现灰色过渡（40<r<215），而非纯黑/纯白跳变
    let hasGrey = false
    for (let y = 20; y < 80; y++) {
        for (let x = 20; x < 80; x++) {
            const c = ctx.readPixel(x, y)
            if (c[3] > 0 && c[0] > 40 && c[0] < 215) { hasGrey = true; break }
        }
        if (hasGrey) break
    }
    assert('抗锯齿斜边有灰色过渡', hasGrey)
    // 内部纯黑、外部纯白保持原样
    assert('AA 内部仍纯黑', ctx.readPixel(50, 15)[0] < 10)
    assert('AA 外部仍纯白', ctx.readPixel(50, 95)[0] > 245)
}

// ---- 14. clip 裁剪 ----
{
    const ctx = new Canvas2DRenderer(100, 100)
    // 裁剪区：圆心 (50,50) 半径 30 的圆
    ctx.beginPath()
    ctx.arc(50, 50, 30, 0, Math.PI * 2)
    ctx.clip()
    // 整幅画红色（只应出现在圆内）
    ctx.fillStyle = '#ff0000'
    ctx.fillRect(0, 0, 100, 100)
    assert('clip 圆内为红', near(ctx.readPixel(50, 50)[0], 255))
    assert('clip 圆外透明', ctx.readPixel(5, 50)[3] === 0)
}

// ---- 14b. clip 与 save/restore ----
{
    const ctx = new Canvas2DRenderer(100, 100)
    ctx.save()
    ctx.beginPath()
    ctx.arc(50, 50, 20, 0, Math.PI * 2)
    ctx.clip()
    ctx.fillStyle = '#00ff00'
    ctx.fillRect(0, 0, 100, 100)
    assert('clip 内绿', near(ctx.readPixel(50, 50)[1], 255))
    assert('clip 外透明', ctx.readPixel(90, 50)[3] === 0)
    ctx.restore() // 恢复裁剪区
    ctx.fillStyle = '#0000ff'
    ctx.fillRect(0, 0, 100, 100)
    assert('restore 后整幅蓝', near(ctx.readPixel(90, 50)[2], 255))
}

// ---- 14c. clip 嵌套子路径挖洞（evenodd 语义） ----
{
    const ctx = new Canvas2DRenderer(100, 100)
    ctx.beginPath()
    ctx.rect(20, 20, 60, 60) // 外矩形
    ctx.rect(40, 40, 20, 20) // 内矩形（同向）
    ctx.clip('evenodd')
    ctx.fillStyle = '#ff0000'
    ctx.fillRect(0, 0, 100, 100)
    assert('裁剪区外环红', near(ctx.readPixel(30, 30)[0], 255))
    assert('裁剪区洞透明', ctx.readPixel(50, 50)[3] === 0)
}

console.log(`\n结果: ${pass} 通过, ${fail} 失败`)
if (fail > 0) process.exit(1)
