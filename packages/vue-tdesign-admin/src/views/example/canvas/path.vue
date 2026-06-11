<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue'
import { Path2D } from './lib/Path2D'
import { PathStroke } from './lib/PathStroke'

function degToRad(deg: number) { return deg * Math.PI / 180 }

const canvas = shallowRef<HTMLCanvasElement>()
const activeTest = ref('ellipseSvgArc')
const hitInfo = ref('')
let currentHitCallback: ((x: number, y: number) => string) | null = null

// ── 测试用例 ──

function testEllipseSvgArc(ctx: CanvasRenderingContext2D) {
    hitInfo.value = '点击弧线区域查看命中'
    const tests0 = [
        { label: '小弧/顺', x1: 50, y1: 100, x2: 200, y2: 50, rx: 120, ry: 80, rotDeg: 0, large: false, sweep: true, color: '#e74c3c' },
        { label: '小弧/逆', x1: 50, y1: 220, x2: 200, y2: 170, rx: 120, ry: 80, rotDeg: 0, large: false, sweep: false, color: '#3498db' },
        { label: '大弧/顺', x1: 50, y1: 340, x2: 200, y2: 290, rx: 120, ry: 80, rotDeg: 0, large: true, sweep: true, color: '#2ecc71' },
        { label: '大弧/逆', x1: 50, y1: 460, x2: 200, y2: 410, rx: 120, ry: 80, rotDeg: 0, large: true, sweep: false, color: '#f39c12' },
    ]
    ctx.font = 'bold 14px sans-serif'
    ctx.fillStyle = '#000'
    ctx.fillText('SVG Arc A vs Path2D.ellipseSvgArc（实线=原生, 虚线=Path2D）', 20, 30)

    for (const t of tests0) {
        const svgStr = `M ${t.x1},${t.y1} A ${t.rx},${t.ry} ${t.rotDeg} ${t.large ? 1 : 0} ${t.sweep ? 1 : 0} ${t.x2},${t.y2}`
        ctx.strokeStyle = t.color
        ctx.lineWidth = 2
        ctx.stroke(new window.Path2D(svgStr))

        const ourPath = new Path2D()
        ourPath.moveTo(t.x1, t.y1)
        ourPath.ellipseSvgArc(t.x1, t.y1, t.x2, t.y2, t.rx, t.ry, degToRad(t.rotDeg), t.large, t.sweep)
        ctx.strokeStyle = '#000'
        ctx.setLineDash([6, 4])
        ctx.stroke(ourPath.toCanvasPath2D())
        ctx.setLineDash([])

        ctx.fillStyle = '#333'
        ctx.font = '11px sans-serif'
        ctx.fillText(t.label, t.x1 - 5, t.y1 - 10)
    }
    ctx.font = '11px sans-serif'
    ctx.fillStyle = '#e74c3c'
    ctx.fillText('■实线=原生SVG', 250, 35)
    ctx.fillStyle = '#000'
    ctx.fillText('---虚线=Path2D', 430, 35)

    currentHitCallback = null
}

function testArcRotated(ctx: CanvasRenderingContext2D) {
    hitInfo.value = '点击弧线区域查看命中'
    const tests = [
        { rotDeg: 30, large: false, sweep: true, color: '#e74c3c', label: '旋转30°' },
        { rotDeg: -30, large: false, sweep: true, color: '#3498db', label: '旋转-30°' },
        { rotDeg: 45, large: false, sweep: false, color: '#2ecc71', label: '旋转45°' },
        { rotDeg: 60, large: true, sweep: true, color: '#9b59b6', label: '旋转60°/大弧' },
    ]
    ctx.font = 'bold 14px sans-serif'
    ctx.fillStyle = '#000'
    ctx.fillText('带旋转的 SVG Arc 对比（实线=原生, 虚线=Path2D）', 20, 30)

    let baseX = 20
    for (const t of tests) {
        const x1 = baseX, y1 = 120, x2 = baseX + 140, y2 = 80, rx = 100, ry = 55
        const svgStr = `M ${x1},${y1} A ${rx},${ry} ${t.rotDeg} ${t.large ? 1 : 0} ${t.sweep ? 1 : 0} ${x2},${y2}`
        ctx.strokeStyle = t.color
        ctx.lineWidth = 2
        ctx.stroke(new window.Path2D(svgStr))

        const ourPath = new Path2D()
        ourPath.moveTo(x1, y1)
        ourPath.ellipseSvgArc(x1, y1, x2, y2, rx, ry, degToRad(t.rotDeg), t.large, t.sweep)
        ctx.strokeStyle = '#000'
        ctx.setLineDash([6, 4])
        ctx.stroke(ourPath.toCanvasPath2D())
        ctx.setLineDash([])

        ctx.fillStyle = '#333'
        ctx.font = '11px sans-serif'
        ctx.fillText(t.label, x1 - 5, y1 - 15)
        ctx.fillStyle = t.color
        ctx.beginPath(); ctx.arc(x1, y1, 3, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(x2, y2, 3, 0, Math.PI * 2); ctx.fill()
        baseX += 190
    }
    ctx.fillStyle = '#666'
    ctx.font = '11px sans-serif'
    ctx.fillText('小圆点=起点/终点', 20, 75)

    // 参考椭圆
    ctx.font = 'bold 14px sans-serif'
    ctx.fillStyle = '#000'
    ctx.fillText('椭圆弧与完整椭圆', 580, 30)
    const ex = 660, ey = 200, erx = 120, ery = 70, erot = degToRad(25)
    const full = new Path2D()
    full.ellipse(ex, ey, erx, ery, erot, 0, Math.PI * 2, false)
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.stroke(full.toCanvasPath2D())
    ctx.setLineDash([])

    const a1 = 0.3, a2 = 2.2
    const cr = Math.cos(erot), sr = Math.sin(erot)
    const px1 = ex + cr * erx * Math.cos(a1) - sr * ery * Math.sin(a1)
    const py1 = ey + sr * erx * Math.cos(a1) + cr * ery * Math.sin(a1)
    const px2 = ex + cr * erx * Math.cos(a2) - sr * ery * Math.sin(a2)
    const py2 = ey + sr * erx * Math.cos(a2) + cr * ery * Math.sin(a2)
    const arcP = new Path2D()
    arcP.moveTo(px1, py1)
    arcP.ellipseSvgArc(px1, py1, px2, py2, erx, ery, erot, (a2 - a1) > Math.PI, false)
    ctx.strokeStyle = '#e74c3c'
    ctx.lineWidth = 3
    ctx.stroke(arcP.toCanvasPath2D())
    ctx.fillStyle = '#e74c3c'
    ctx.beginPath(); ctx.arc(px1, py1, 4, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(px2, py2, 4, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#666'
    ctx.font = '11px sans-serif'
    ctx.fillText('灰色虚线: 完整椭圆(旋转25°)', 580, 60)
    ctx.fillStyle = '#e74c3c'
    ctx.fillText('红色: ellipseSvgArc弧段', 580, 75)

    currentHitCallback = null
}

function testBezierPaths(ctx: CanvasRenderingContext2D) {
    hitInfo.value = '点击路径区域查看填充命中'
    const path = new Path2D()
    path.moveTo(100, 150)
    path.quadraticCurveTo(200, 50, 300, 150)
    path.bezierCurveTo(400, 50, 500, 250, 600, 150)
    path.lineTo(600, 400)
    path.lineTo(100, 400)
    path.close()

    ctx.strokeStyle = '#e74c3c'
    ctx.lineWidth = 2
    ctx.stroke(path.toCanvasPath2D())
    ctx.fillStyle = 'rgba(231,76,60,0.1)'
    ctx.fill(path.toCanvasPath2D())

    // 绘制控制点
    ctx.fillStyle = '#999'
    ctx.font = '11px sans-serif'
    ctx.fillText('Q: (200,50)', 205, 55)
    ctx.beginPath(); ctx.arc(200, 50, 3, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#999'
    ctx.fillText('C: (400,50)(500,250)', 405, 55)
    ctx.beginPath(); ctx.arc(400, 50, 3, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(500, 250, 3, 0, Math.PI * 2); ctx.fill()

    // 包围盒
    const bounds = path.getBounds()
    if (bounds) {
        ctx.strokeStyle = '#3498db'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.strokeRect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY)
        ctx.setLineDash([])
        ctx.fillStyle = '#3498db'
        ctx.font = '11px sans-serif'
        ctx.fillText(`包围盒: (${bounds.minX},${bounds.minY})-(${bounds.maxX},${bounds.maxY})`, bounds.minX, bounds.minY - 10)
    }

    currentHitCallback = (x, y) => {
        const hit = path.contains(x, y)
        return hit ? `命中填充区域 (${x},${y})` : `未命中 (${x},${y})`
    }
}

function testStrokeHit(ctx: CanvasRenderingContext2D) {
    hitInfo.value = '点击描边区域测试 stroke 命中'
    const path = new Path2D()
    path.moveTo(100, 100)
    path.lineTo(300, 200)
    path.bezierCurveTo(400, 50, 500, 150, 600, 100)
    path.lineTo(700, 300)

    const strokeOpts = { strokeWidth: 16, lineCap: 'round' as const, lineJoin: 'round' as const }
    const stroke = new PathStroke(path, strokeOpts)

    // 绘制描边路径
    ctx.strokeStyle = '#e74c3c'
    ctx.lineWidth = 16
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke(path.toCanvasPath2D())

    // 绘制描边轮廓
    const fillPath = stroke.toFillPath()
    ctx.strokeStyle = 'rgba(52,152,219,0.4)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.stroke(fillPath.toCanvasPath2D())
    ctx.setLineDash([])

    ctx.fillStyle = '#333'
    ctx.font = '12px sans-serif'
    ctx.fillText('红色=描边（width=16, round, round）', 100, 380)
    ctx.fillStyle = '#3498db'
    ctx.fillText('蓝色虚线=PathStroke偏移轮廓', 100, 398)

    currentHitCallback = (x, y) => {
        const byFlatten = stroke.containsByFlatten(x, y)
        const byCurve = stroke.containsByCurve(x, y)
        const byOffset = stroke.containsByOffset(x, y)
        return `Flatten:${byFlatten ? '✓' : '✗'} Curve:${byCurve ? '✓' : '✗'} Offset:${byOffset ? '✓' : '✗'}`
    }
}

function testLineJoinCap(ctx: CanvasRenderingContext2D) {
    hitInfo.value = '点击描边区域测试 lineJoin/lineCap 命中'

    const drawTest = (x: number, y: number, label: string, path: Path2D, cap: string, join: string, sw: number) => {
        const opts = {
            strokeWidth: sw,
            lineCap: cap as any,
            lineJoin: join as any,
            miterLimit: 10,
        }
        const stroke = new PathStroke(path, opts)
        ctx.strokeStyle = '#e74c3c'
        ctx.lineWidth = sw
        ctx.lineCap = cap as any
        ctx.lineJoin = join as any
        ctx.stroke(path.toCanvasPath2D())

        const fillPath = stroke.toFillPath()
        ctx.strokeStyle = 'rgba(52,152,219,0.3)'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.stroke(fillPath.toCanvasPath2D())
        ctx.setLineDash([])

        ctx.fillStyle = '#333'
        ctx.font = '11px sans-serif'
        ctx.fillText(label, x, y + sw + 15)
    }

    // 拐角对比
    const makePath = (pts: [number, number][]) => {
        const p = new Path2D()
        p.moveTo(pts[0][0], pts[0][1])
        for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1])
        return p
    }

    drawTest(100, 60, 'miter (default)', makePath([[100, 60], [160, 10], [220, 60]]), 'butt', 'miter', 14)
    drawTest(100, 160, 'bevel', makePath([[100, 160], [160, 110], [220, 160]]), 'butt', 'bevel', 14)
    drawTest(100, 260, 'round', makePath([[100, 260], [160, 210], [220, 260]]), 'butt', 'round', 14)

    // cap 对比（开放路径）
    const capPath = (x: number, y: number) => {
        const p = new Path2D()
        p.moveTo(x, y)
        p.lineTo(x + 80, y + 40)
        return p
    }
    drawTest(350, 60, 'lineCap:butt', capPath(350, 60), 'butt', 'miter', 16)
    drawTest(350, 130, 'lineCap:round', capPath(350, 130), 'round', 'miter', 16)
    drawTest(350, 200, 'lineCap:square', capPath(350, 200), 'square', 'miter', 16)

    // miterLimit 对比
    const miters = [
        { limit: 1.5, y: 300, label: 'miterLimit=1.5(→bevel)' },
        { limit: 4, y: 370, label: 'miterLimit=4' },
        { limit: 10, y: 440, label: 'miterLimit=10(默认)' },
    ]
    for (const m of miters) {
        const mp = makePath([[500, m.y], [620, m.y - 70], [740, m.y]])
        ctx.lineWidth = 18
        ctx.lineCap = 'butt'
        ctx.lineJoin = 'miter'
        ctx.miterLimit = m.limit
        ctx.strokeStyle = '#e74c3c'
        ctx.stroke(mp.toCanvasPath2D())

        const stroke = new PathStroke(mp, { strokeWidth: 18, lineCap: 'butt', lineJoin: 'miter', miterLimit: m.limit })
        const fp = stroke.toFillPath()
        ctx.strokeStyle = 'rgba(52,152,219,0.3)'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.stroke(fp.toCanvasPath2D())
        ctx.setLineDash([])
        ctx.fillStyle = '#333'
        ctx.font = '11px sans-serif'
        ctx.fillText(m.label, 500, m.y + 25)
    }

    currentHitCallback = null
}

function testArcEllipse(ctx: CanvasRenderingContext2D) {
    hitInfo.value = '点击路径区域测试填充/描边命中'
    const path = new Path2D()
    // 组合：rect + arc + ellipse
    path.rect(100, 50, 200, 150)
    path.arc(400, 125, 80, 0, Math.PI * 1.5, false)
    path.close()
    path.ellipse(600, 125, 100, 50, degToRad(30), 0, Math.PI * 2, false)

    ctx.strokeStyle = '#e74c3c'
    ctx.lineWidth = 2
    ctx.stroke(path.toCanvasPath2D())
    ctx.fillStyle = 'rgba(231,76,60,0.08)'
    ctx.fill(path.toCanvasPath2D())

    // 包围盒
    const bounds = path.getBounds()
    if (bounds) {
        ctx.strokeStyle = '#3498db'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.strokeRect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY)
        ctx.setLineDash([])
        ctx.fillStyle = '#3498db'
        ctx.font = '11px sans-serif'
        ctx.fillText(`Bounds:(${bounds.minX | 0},${bounds.minY | 0})-(${bounds.maxX | 0},${bounds.maxY | 0})`, bounds.minX, bounds.minY - 8)
    }

    // 描边命中测试
    const strokePath = new PathStroke(path, { strokeWidth: 8, lineJoin: 'round' })
    const fillPath = strokePath.toFillPath()
    ctx.strokeStyle = 'rgba(52,152,219,0.3)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.stroke(fillPath.toCanvasPath2D())
    ctx.setLineDash([])

    ctx.fillStyle = '#333'
    ctx.font = '12px sans-serif'
    ctx.fillText('rect + arc(270°) + ellipse(旋转30°)', 100, 310)
    ctx.fillStyle = '#3498db'
    ctx.fillText('蓝色虚线=描边偏移轮廓(width=8)', 100, 328)
    ctx.fillStyle = '#666'
    ctx.fillText('填充:半透明粉色    描边:红色实线', 100, 346)

    currentHitCallback = (x, y) => {
        const fillHit = path.contains(x, y)
        const strokeHit = strokePath.contains(x, y)
        let msg = `填充:${fillHit ? '✓' : '✗'}`
        if (strokeHit) msg += ` 描边:✓(f=${strokePath.containsByFlatten(x, y) ? '1' : '0'} o=${strokePath.containsByOffset(x, y) ? '1' : '0'})`
        else msg += ' 描边:✗'
        return msg
    }
}

function testComplexPath(ctx: CanvasRenderingContext2D) {
    hitInfo.value = '点击路径区域测试复杂图形命中'
    // 构建复杂路径
    const path = new Path2D()
    // 五角星大致形状（贝塞尔模拟）
    path.moveTo(200, 50)
    path.bezierCurveTo(220, 50, 240, 60, 250, 80)
    path.quadraticCurveTo(260, 60, 280, 50)
    path.lineTo(300, 100)
    path.quadraticCurveTo(320, 80, 350, 90)
    path.lineTo(320, 140)
    path.arcTo(340, 160, 320, 180, 20)
    path.lineTo(280, 180)
    path.quadraticCurveTo(250, 220, 220, 180)
    path.lineTo(180, 190)
    path.arcTo(160, 180, 150, 160, 15)
    path.lineTo(150, 130)
    path.quadraticCurveTo(120, 120, 100, 150)
    path.lineTo(130, 100)
    path.arcTo(150, 80, 170, 70, 12)
    path.close()

    // fill + stroke
    ctx.fillStyle = 'rgba(46,204,113,0.08)'
    ctx.fill(path.toCanvasPath2D())
    ctx.strokeStyle = '#2ecc71'
    ctx.lineWidth = 2
    ctx.stroke(path.toCanvasPath2D())

    // 包围盒
    const bounds = path.getBounds()
    if (bounds) {
        ctx.strokeStyle = '#3498db'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.strokeRect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY)
        ctx.setLineDash([])
        ctx.fillStyle = '#3498db'
        ctx.font = '11px sans-serif'
        ctx.fillText(`Bounds:(${bounds.minX | 0},${bounds.minY | 0})-(${bounds.maxX | 0},${bounds.maxY | 0})`, bounds.minX, bounds.minY - 8)
    }

    // 描边命中
    const strokePath = new PathStroke(path, { strokeWidth: 10, lineCap: 'round', lineJoin: 'round' })
    const fillPath = strokePath.toFillPath()
    ctx.strokeStyle = 'rgba(155,89,182,0.3)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.stroke(fillPath.toCanvasPath2D())
    ctx.setLineDash([])

    ctx.fillStyle = '#333'
    ctx.font = '12px sans-serif'
    ctx.fillText('复杂路径: quadraticCurveTo/bezierCurveTo/arcTo/lineTo 组合', 100, 300)
    ctx.fillStyle = '#2ecc71'
    ctx.fillText('绿色=描边  淡绿色=填充', 100, 318)
    ctx.fillStyle = '#9b59b6'
    ctx.fillText('紫色虚线=描边偏移轮廓(width=10)', 100, 336)

    // hit test 点标记（绘制一些预设点）
    const hitPoints = [
        { x: 200, y: 100, label: '内部' },
        { x: 250, y: 150, label: '内部' },
        { x: 150, y: 80, label: '外部' },
        { x: 250, y: 80, label: '描边?', onStroke: true },
    ]
    for (const p of hitPoints) {
        if (p.onStroke) {
            ctx.fillStyle = '#f39c12'
        } else {
            ctx.fillStyle = path.contains(p.x, p.y) ? '#2ecc71' : '#ccc'
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#333'
        ctx.font = '10px sans-serif'
        ctx.fillText(p.label, p.x + 6, p.y + 3)
    }

    currentHitCallback = (x, y) => {
        const fillHit = path.contains(x, y)
        const strokeHit = strokePath.contains(x, y)
        return `填充:${fillHit ? '✓' : '✗'}  描边:${strokeHit ? '✓' : '✗'}`
    }
}

function testRoundRect(ctx: CanvasRenderingContext2D) {
    hitInfo.value = '点击测试 roundRect 填充/描边'
    const path = new Path2D()
    path.roundRect(100, 60, 250, 180, [20, 40, 60, 80])
    path.roundRect(420, 60, 200, 200, 30)
    path.roundRect(680, 60, 150, 200, [0, 50, 0, 50])

    ctx.fillStyle = 'rgba(52,152,219,0.08)'
    ctx.fill(path.toCanvasPath2D())
    ctx.strokeStyle = '#3498db'
    ctx.lineWidth = 2
    ctx.stroke(path.toCanvasPath2D())

    const bounds = path.getBounds()
    if (bounds) {
        ctx.strokeStyle = '#e74c3c'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.strokeRect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY)
        ctx.setLineDash([])
        ctx.fillStyle = '#e74c3c'
        ctx.font = '11px sans-serif'
        ctx.fillText(`Bounds:(${bounds.minX | 0},${bounds.minY | 0})-(${bounds.maxX | 0},${bounds.maxY | 0})`, bounds.minX, bounds.minY - 8)
    }

    // 描边
    const strokePath = new PathStroke(path, { strokeWidth: 8, lineCap: 'round', lineJoin: 'round' })
    ctx.strokeStyle = 'rgba(231,76,60,0.3)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.stroke(strokePath.toFillPath().toCanvasPath2D())
    ctx.setLineDash([])

    ctx.font = '12px sans-serif'
    ctx.fillStyle = '#333'
    ctx.fillText('roundRect([20,40,60,80])', 100, 310)
    ctx.fillText('roundRect(30)', 420, 310)
    ctx.fillText('roundRect([0,50,0,50])', 680, 310)

    currentHitCallback = (x, y) => {
        return `填充:${path.contains(x, y) ? '✓' : '✗'}  描边:${strokePath.contains(x, y) ? '✓' : '✗'}`
    }
}

function testArcToConnections(ctx: CanvasRenderingContext2D) {
    hitInfo.value = '点击测试 arcTo 圆角连接'
    const path = new Path2D()
    path.moveTo(80, 100)
    path.arcTo(200, 100, 200, 250, 60)
    path.arcTo(200, 400, 80, 400, 40)
    path.arcTo(80, 250, 200, 250, 30)

    ctx.fillStyle = 'rgba(155,89,182,0.08)'
    ctx.fill(path.toCanvasPath2D())
    ctx.strokeStyle = '#9b59b6'
    ctx.lineWidth = 2
    ctx.stroke(path.toCanvasPath2D())

    // 标注 arcTo 控制点
    ctx.fillStyle = '#999'
    ctx.font = '11px sans-serif'
    const pts = [[80, 100], [200, 100], [200, 250], [200, 400], [80, 400], [80, 250], [200, 250]]
    for (let i = 0; i < pts.length; i++) {
        ctx.beginPath(); ctx.arc(pts[i][0], pts[i][1], 3, 0, Math.PI * 2); ctx.fill()
        if (i === 0) ctx.fillText('起点', pts[i][0] + 6, pts[i][1] + 3)
        else ctx.fillText(`P${i}`, pts[i][0] + 6, pts[i][1] + 3)
    }

    // 包围盒
    const bounds = path.getBounds()
    if (bounds) {
        ctx.strokeStyle = '#e74c3c'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.strokeRect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY)
        ctx.setLineDash([])
        ctx.fillStyle = '#e74c3c'
        ctx.font = '11px sans-serif'
        ctx.fillText(`Bounds:(${bounds.minX | 0},${bounds.minY | 0})-(${bounds.maxX | 0},${bounds.maxY | 0})`, bounds.minX, bounds.minY - 8)
    }

    // 描边
    const strokePath = new PathStroke(path, { strokeWidth: 10, lineCap: 'round', lineJoin: 'round' })
    ctx.strokeStyle = 'rgba(231,76,60,0.3)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.stroke(strokePath.toFillPath().toCanvasPath2D())
    ctx.setLineDash([])

    ctx.font = '12px sans-serif'
    ctx.fillStyle = '#333'
    ctx.fillText('arcTo 连续圆角连接 + stroke offset', 80, 480)

    currentHitCallback = (x, y) => {
        const fillHit = path.contains(x, y)
        const strokeHit = strokePath.contains(x, y)
        return `填充:${fillHit ? '✓' : '✗'}  描边:${strokeHit ? '✓' : '✗'}`
    }
}

// ── 测试用例注册 ──
interface TestCase { key: string; label: string; fn: (ctx: CanvasRenderingContext2D) => void }
const allTests: TestCase[] = [
    { key: 'ellipseSvgArc', label: 'SVG Arc 对比（旋转=0）', fn: testEllipseSvgArc },
    { key: 'arcRotated', label: 'SVG Arc 对比（带旋转）', fn: testArcRotated },
    { key: 'bezierPaths', label: '贝塞尔路径 + 包围盒 + 填充命中', fn: testBezierPaths },
    { key: 'strokeHit', label: '描边命中测试（三种方案）', fn: testStrokeHit },
    { key: 'lineJoinCap', label: 'lineJoin/lineCap/miterLimit', fn: testLineJoinCap },
    { key: 'arcEllipse', label: 'rect+arc+ellipse 综合', fn: testArcEllipse },
    { key: 'complexPath', label: '复杂路径（贝塞尔/arcTo混合）', fn: testComplexPath },
    { key: 'roundRect', label: 'roundRect 圆角矩形', fn: testRoundRect },
    { key: 'arcToConnections', label: 'arcTo 圆角连接', fn: testArcToConnections },
]

onMounted(() => {
    const ctx = canvas.value!.getContext('2d')!
    runTest(ctx)

    canvas.value!.addEventListener('mousedown', (e) => {
        const rect = canvas.value!.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const dpr = canvas.value!.width / rect.width
        if (currentHitCallback) {
            hitInfo.value = currentHitCallback(x * dpr, y * dpr)
        }
    })
})

function runTest(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    currentHitCallback = null
    hitInfo.value = '点击画布查看命中信息'
    const test = allTests.find(t => t.key === activeTest.value)
    if (test) test.fn(ctx)
}
</script>

<template>
    <div style="padding:10px;font-family:sans-serif">
        <div style="margin-bottom:8px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <label style="font-weight:bold">选择测试:</label>
            <select v-model="activeTest" @change="canvas && runTest(canvas.getContext('2d')!)"
                style="padding:4px 8px;font-size:14px;min-width:260px">
                <option v-for="t in allTests" :key="t.key" :value="t.key">{{ t.label }}</option>
            </select>
            <span style="font-size:13px;color:#e74c3c">{{ hitInfo }}</span>
        </div>
        <canvas ref="canvas" width="1200" height="700"
            style="border:1px solid #ddd;width:100%;max-width:1200px;cursor:crosshair"></canvas>
    </div>
</template>
