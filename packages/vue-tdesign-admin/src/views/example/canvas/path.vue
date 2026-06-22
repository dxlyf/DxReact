<script setup lang="ts">
import { onMounted, ref, shallowRef, reactive, watch, computed } from 'vue'
import { Path2D } from './lib/Path2D'
import { PathStroke } from './lib/PathStroke'

function degToRad(deg: number) { return deg * Math.PI / 180 }

const canvas = shallowRef<HTMLCanvasElement>()

// ── 测试用例定义 ──

interface TestCase {
  key: string
  label: string
  params: Record<string, ParamDef>
  draw: (ctx: CanvasRenderingContext2D, p: Record<string, any>) => void
}

interface ParamDef {
  label: string
  type: 'number' | 'boolean' | 'select'
  default: any
  min?: number
  max?: number
  step?: number
  options?: { label: string; value: any }[]
}

function defineTest(key: string, label: string, params: Record<string, ParamDef>, draw: TestCase['draw']): TestCase {
  return { key, label, params, draw }
}

const tests: TestCase[] = [
  defineTest('arc', 'arc 圆弧', {
    cx: { label: '圆心 X', type: 'number', default: 300, min: 0, max: 800, step: 1 },
    cy: { label: '圆心 Y', type: 'number', default: 250, min: 0, max: 600, step: 1 },
    radius: { label: '半径', type: 'number', default: 150, min: 10, max: 300, step: 1 },
    startAngle: { label: '起始角度°', type: 'number', default: 0, min: -360, max: 360, step: 1 },
    endAngle: { label: '结束角度°', type: 'number', default: 270, min: -360, max: 360, step: 1 },
    counterclockwise: { label: '逆时针', type: 'boolean', default: false },
    showFull: { label: '显示完整参考圆', type: 'boolean', default: true },
  }, (ctx, p) => {
    const cx = p.cx, cy = p.cy, r = p.radius
    const sa = degToRad(p.startAngle), ea = degToRad(p.endAngle), ccw = p.counterclockwise

    // 参考完整圆
    if (p.showFull) {
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = '#ddd'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#999'
      ctx.font = '11px sans-serif'
      ctx.fillText('参考圆', cx + r + 5, cy)
    }

    // 原生 Path2D
    const nativePath = new window.Path2D()
    nativePath.arc(cx, cy, r, sa, ea, ccw)
    ctx.strokeStyle = '#e74c3c'
    ctx.lineWidth = 3
    ctx.stroke(nativePath)

    // 我们的 Path2D
    const ourPath = new Path2D()
    ourPath.arc(cx, cy, r, sa, ea, ccw)
    ctx.strokeStyle = '#3498db'
    ctx.lineWidth = 3
    ctx.setLineDash([6, 4])
    ctx.stroke(ourPath.toCanvasPath2D())
    ctx.setLineDash([])

    ctx.fillStyle = '#e74c3c'
    ctx.font = '12px sans-serif'
    ctx.fillText('原生 arc', cx + r + 5, cy + 20)
    ctx.fillStyle = '#3498db'
    ctx.fillText('Path2D arc (虚线)', cx + r + 5, cy + 38)
  }),

  defineTest('ellipse', 'ellipse 椭圆', {
    cx: { label: '中心 X', type: 'number', default: 350, min: 0, max: 800, step: 1 },
    cy: { label: '中心 Y', type: 'number', default: 250, min: 0, max: 600, step: 1 },
    rx: { label: 'X 半径', type: 'number', default: 180, min: 10, max: 350, step: 1 },
    ry: { label: 'Y 半径', type: 'number', default: 100, min: 10, max: 350, step: 1 },
    rotation: { label: '旋转°', type: 'number', default: 30, min: -180, max: 180, step: 1 },
    startAngle: { label: '起始角度°', type: 'number', default: 0, min: -360, max: 360, step: 1 },
    endAngle: { label: '结束角度°', type: 'number', default: 300, min: -360, max: 360, step: 1 },
    counterclockwise: { label: '逆时针', type: 'boolean', default: false },
  }, (ctx, p) => {
    const cx = p.cx, cy = p.cy, rx = p.rx, ry = p.ry
    const rot = degToRad(p.rotation), sa = degToRad(p.startAngle), ea = degToRad(p.endAngle), ccw = p.counterclockwise

    // 参考完整椭圆
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2)
    ctx.strokeStyle = '#ddd'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.stroke()
    ctx.setLineDash([])

    // 原生
    const native = new window.Path2D()
    native.ellipse(cx, cy, rx, ry, rot, sa, ea, ccw)
    ctx.strokeStyle = '#e74c3c'
    ctx.lineWidth = 3
  //    ctx.setLineDash([6, 4])
    ctx.stroke(native)

    // 我们的
    const our = new Path2D()
    our.ellipse(cx, cy, rx, ry, rot, sa, ea, ccw)
    ctx.strokeStyle = '#3498db'
    ctx.lineWidth = 3
    ctx.setLineDash([6, 4])
    ctx.stroke(our.toCanvasPath2D())
    ctx.setLineDash([])

    ctx.fillStyle = '#e74c3c'
    ctx.font = '12px sans-serif'
    ctx.fillText('原生 ellipse', 20, 30)
    ctx.fillStyle = '#3498db'
    ctx.fillText('Path2D ellipse (虚线)', 20, 48)
  }),

  defineTest('arcTo', 'arcTo 圆角连接', {
    x0: { label: '起点 X', type: 'number', default: 100, min: 0, max: 800, step: 1 },
    y0: { label: '起点 Y', type: 'number', default: 300, min: 0, max: 600, step: 1 },
    x1: { label: '控制点1 X', type: 'number', default: 300, min: 0, max: 800, step: 1 },
    y1: { label: '控制点1 Y', type: 'number', default: 100, min: 0, max: 600, step: 1 },
    x2: { label: '控制点2 X', type: 'number', default: 500, min: 0, max: 800, step: 1 },
    y2: { label: '控制点2 Y', type: 'number', default: 300, min: 0, max: 600, step: 1 },
    radius: { label: '半径', type: 'number', default: 80, min: 1, max: 300, step: 1 },
  }, (ctx, p) => {
    const { x0, y0, x1, y1, x2, y2, radius } = p

    // 绘制控制线（半透明）
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#999'
    ctx.font = '11px sans-serif'
    ctx.fillText(`P0(${x0},${y0})`, x0 + 5, y0 - 5)
    ctx.fillText(`P1(${x1},${y1})`, x1 + 5, y1 - 5)
    ctx.fillText(`P2(${x2},${y2})`, x2 + 5, y2 - 5)
    ctx.beginPath(); ctx.arc(x0, y0, 3, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(x1, y1, 3, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(x2, y2, 3, 0, Math.PI * 2); ctx.fill()

    // 原生
    const native = new window.Path2D()
    native.moveTo(x0, y0)
    native.arcTo(x1, y1, x2, y2, radius)
    ctx.strokeStyle = '#e74c3c'
    ctx.lineWidth = 3
    ctx.stroke(native)

    // 我们的
    const our = new Path2D()
    our.moveTo(x0, y0)
    our.arcTo(x1, y1, x2, y2, radius)
    ctx.strokeStyle = '#3498db'
    ctx.lineWidth = 3
    ctx.setLineDash([6, 4])
    ctx.stroke(our.toCanvasPath2D())
    ctx.setLineDash([])

    ctx.fillStyle = '#e74c3c'
    ctx.font = '12px sans-serif'
    ctx.fillText('原生 arcTo', 20, 30)
    ctx.fillStyle = '#3498db'
    ctx.fillText('Path2D arcTo (虚线)', 20, 48)
  }),

  defineTest('roundRect', 'roundRect 圆角矩形', {
    x: { label: 'X', type: 'number', default: 100, min: 0, max: 800, step: 1 },
    y: { label: 'Y', type: 'number', default: 150, min: 0, max: 600, step: 1 },
    w: { label: '宽度', type: 'number', default: 400, min: 10, max: 800, step: 1 },
    h: { label: '高度', type: 'number', default: 250, min: 10, max: 600, step: 1 },
    radiusTL: { label: '左上圆角', type: 'number', default: 40, min: 0, max: 200, step: 1 },
    radiusTR: { label: '右上圆角', type: 'number', default: 60, min: 0, max: 200, step: 1 },
    radiusBR: { label: '右下圆角', type: 'number', default: 80, min: 0, max: 200, step: 1 },
    radiusBL: { label: '左下圆角', type: 'number', default: 20, min: 0, max: 200, step: 1 },
  }, (ctx, p) => {
    const radii = [p.radiusTL, p.radiusTR, p.radiusBR, p.radiusBL]

    // 原生 roundRect（Chrome 99+）
    const native = new window.Path2D()
    native.roundRect(p.x, p.y, p.w, p.h, radii)
    ctx.strokeStyle = '#e74c3c'
    ctx.lineWidth = 3
    ctx.stroke(native)

    // 我们的
    const our = new Path2D()
    our.roundRect(p.x, p.y, p.w, p.h, radii)
    ctx.strokeStyle = '#3498db'
    ctx.lineWidth = 3
    ctx.setLineDash([6, 4])
    ctx.stroke(our.toCanvasPath2D())
    ctx.setLineDash([])

    ctx.fillStyle = '#e74c3c'
    ctx.font = '12px sans-serif'
    ctx.fillText('原生 roundRect', 20, 30)
    ctx.fillStyle = '#3498db'
    ctx.fillText('Path2D roundRect (虚线)', 20, 48)
  }),

  defineTest('bezier', 'bezierCurveTo 三次贝塞尔', {
    x0: { label: '起点 X', type: 'number', default: 100, min: 0, max: 800, step: 1 },
    y0: { label: '起点 Y', type: 'number', default: 300, min: 0, max: 600, step: 1 },
    cp1x: { label: '控制点1 X', type: 'number', default: 200, min: 0, max: 800, step: 1 },
    cp1y: { label: '控制点1 Y', type: 'number', default: 50, min: 0, max: 600, step: 1 },
    cp2x: { label: '控制点2 X', type: 'number', default: 500, min: 0, max: 800, step: 1 },
    cp2y: { label: '控制点2 Y', type: 'number', default: 500, min: 0, max: 600, step: 1 },
    x: { label: '终点 X', type: 'number', default: 600, min: 0, max: 800, step: 1 },
    y: { label: '终点 Y', type: 'number', default: 300, min: 0, max: 600, step: 1 },
    showControls: { label: '显示控制点', type: 'boolean', default: true },
  }, (ctx, p) => {
    // 控制多边形
    if (p.showControls) {
      ctx.strokeStyle = 'rgba(0,0,0,0.1)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath(); ctx.moveTo(p.x0, p.y0); ctx.lineTo(p.cp1x, p.cp1y); ctx.lineTo(p.cp2x, p.cp2y); ctx.lineTo(p.x, p.y); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#999'
      ;[[p.x0, p.y0, 'P0'],[p.cp1x, p.cp1y, 'CP1'],[p.cp2x, p.cp2y, 'CP2'],[p.x, p.y, 'P3']].forEach(([x, y, l]) => {
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill()
        ctx.fillText(l as string, (x as number) + 5, (y as number) - 8)
      })
    }

    const native = new window.Path2D()
    native.moveTo(p.x0, p.y0)
    native.bezierCurveTo(p.cp1x, p.cp1y, p.cp2x, p.cp2y, p.x, p.y)
    ctx.strokeStyle = '#e74c3c'
    ctx.lineWidth = 3
    ctx.stroke(native)

    const our = new Path2D()
    our.moveTo(p.x0, p.y0)
    our.bezierCurveTo(p.cp1x, p.cp1y, p.cp2x, p.cp2y, p.x, p.y)
    ctx.strokeStyle = '#3498db'
    ctx.lineWidth = 3
    ctx.setLineDash([6, 4])
    ctx.stroke(our.toCanvasPath2D())
    ctx.setLineDash([])

    ctx.fillStyle = '#e74c3c'
    ctx.font = '12px sans-serif'
    ctx.fillText('原生 bezierCurveTo', 20, 30)
    ctx.fillStyle = '#3498db'
    ctx.fillText('Path2D bezierCurveTo (虚线)', 20, 48)
  }),

  defineTest('quadratic', 'quadraticCurveTo 二次贝塞尔', {
    x0: { label: '起点 X', type: 'number', default: 100, min: 0, max: 800, step: 1 },
    y0: { label: '起点 Y', type: 'number', default: 250, min: 0, max: 600, step: 1 },
    cpx: { label: '控制点 X', type: 'number', default: 350, min: 0, max: 800, step: 1 },
    cpy: { label: '控制点 Y', type: 'number', default: 50, min: 0, max: 600, step: 1 },
    x: { label: '终点 X', type: 'number', default: 600, min: 0, max: 800, step: 1 },
    y: { label: '终点 Y', type: 'number', default: 250, min: 0, max: 600, step: 1 },
    showControls: { label: '显示控制点', type: 'boolean', default: true },
  }, (ctx, p) => {
    if (p.showControls) {
      ctx.strokeStyle = 'rgba(0,0,0,0.1)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath(); ctx.moveTo(p.x0, p.y0); ctx.lineTo(p.cpx, p.cpy); ctx.lineTo(p.x, p.y); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#999'
      ;[[p.x0, p.y0, 'P0'],[p.cpx, p.cpy, 'CP'],[p.x, p.y, 'P2']].forEach(([x, y, l]) => {
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill()
        ctx.fillText(l as string, (x as number) + 5, (y as number) - 8)
      })
    }

    const native = new window.Path2D()
    native.moveTo(p.x0, p.y0)
    native.quadraticCurveTo(p.cpx, p.cpy, p.x, p.y)
    ctx.strokeStyle = '#e74c3c'
    ctx.lineWidth = 3
    ctx.stroke(native)

    const our = new Path2D()
    our.moveTo(p.x0, p.y0)
    our.quadraticCurveTo(p.cpx, p.cpy, p.x, p.y)
    ctx.strokeStyle = '#3498db'
    ctx.lineWidth = 3
    ctx.setLineDash([6, 4])
    ctx.stroke(our.toCanvasPath2D())
    ctx.setLineDash([])

    ctx.fillStyle = '#e74c3c'
    ctx.font = '12px sans-serif'
    ctx.fillText('原生 quadraticCurveTo', 20, 30)
    ctx.fillStyle = '#3498db'
    ctx.fillText('Path2D quadraticCurveTo (虚线)', 20, 48)
  }),

  defineTest('ellipseSvgArc', 'ellipseSvgArc SVG弧转换', {
    x1: { label: '起点 X', type: 'number', default: 100, min: 0, max: 800, step: 1 },
    y1: { label: '起点 Y', type: 'number', default: 300, min: 0, max: 600, step: 1 },
    x2: { label: '终点 X', type: 'number', default: 500, min: 0, max: 800, step: 1 },
    y2: { label: '终点 Y', type: 'number', default: 150, min: 0, max: 600, step: 1 },
    rx: { label: 'X 半径', type: 'number', default: 200, min: 10, max: 400, step: 1 },
    ry: { label: 'Y 半径', type: 'number', default: 120, min: 10, max: 400, step: 1 },
    rotation: { label: '旋转°', type: 'number', default: 0, min: -180, max: 180, step: 1 },
    largeArc: { label: '大弧', type: 'boolean', default: false },
    sweep: { label: '顺时针', type: 'boolean', default: true },
  }, (ctx, p) => {
    const rotDeg = p.rotation
    const { x1, y1, x2, y2, rx, ry, largeArc, sweep } = p

    // 参考椭圆
    ctx.strokeStyle = '#ddd'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.ellipse((x1 + x2) / 2, (y1 + y2) / 2, rx, ry, degToRad(rotDeg), 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#999'
    ctx.font = '11px sans-serif'
    ctx.fillText('参考椭圆', (x1 + x2) / 2 + rx + 5, (y1 + y2) / 2)

    ctx.fillStyle = '#999'
    ctx.beginPath(); ctx.arc(x1, y1, 4, 0, Math.PI * 2); ctx.fill()
    ctx.fillText('起点', x1 + 6, y1 + 4)
    ctx.beginPath(); ctx.arc(x2, y2, 4, 0, Math.PI * 2); ctx.fill()
    ctx.fillText('终点', x2 + 6, y2 + 4)

    // SVG 原生
    const svgStr = `M ${x1},${y1} A ${rx},${ry} ${rotDeg} ${largeArc ? 1 : 0} ${sweep ? 1 : 0} ${x2},${y2}`
    const native = new window.Path2D(svgStr)
    ctx.strokeStyle = '#e74c3c'
    ctx.lineWidth = 3
    ctx.stroke(native)

    // 我们的
    const our = new Path2D()
    our.moveTo(x1, y1)
    our.ellipseSvgArc(x1, y1, x2, y2, rx, ry, degToRad(rotDeg), largeArc, sweep)
    ctx.strokeStyle = '#3498db'
    ctx.lineWidth = 3
    ctx.setLineDash([6, 4])
    ctx.stroke(our.toCanvasPath2D())
    ctx.setLineDash([])

    ctx.fillStyle = '#e74c3c'
    ctx.font = '12px sans-serif'
    ctx.fillText('原生 SVG Path A', 20, 30)
    ctx.fillStyle = '#3498db'
    ctx.fillText('Path2D.ellipseSvgArc (虚线)', 20, 48)
  }),

  defineTest('complex', '复杂路径组合', {
    strokeW: { label: '描边宽度', type: 'number', default: 2, min: 1, max: 10, step: 0.5 },
    showFill: { label: '显示填充', type: 'boolean', default: true },
  }, (ctx, p) => {
    // 构建复杂路径
    const buildPath = (): Path2D => {
      const path = new Path2D()
      path.moveTo(200, 100)
      path.bezierCurveTo(250, 50, 300, 80, 350, 100)
      path.quadraticCurveTo(400, 120, 450, 80)
      path.arcTo(500, 50, 550, 100, 30)
      path.lineTo(600, 200)
      path.arc(600, 250, 50, -Math.PI / 2, Math.PI / 2, false)
      path.lineTo(550, 350)
      path.ellipse(400, 380, 100, 60, 0.3, 0, Math.PI, false)
      path.lineTo(250, 350)
      path.quadraticCurveTo(200, 300, 150, 320)
      path.arcTo(100, 330, 100, 250, 40)
      path.lineTo(120, 180)
      path.close()
      return path
    }

    const ourPath = buildPath()

    // 用 native 重建
    const native = new window.Path2D()
    native.moveTo(200, 100)
    native.bezierCurveTo(250, 50, 300, 80, 350, 100)
    native.quadraticCurveTo(400, 120, 450, 80)
    native.arcTo(500, 50, 550, 100, 30)
    native.lineTo(600, 200)
    native.arc(600, 250, 50, -Math.PI / 2, Math.PI / 2, false)
    native.lineTo(550, 350)
    native.ellipse(400, 380, 100, 60, 0.3, 0, Math.PI, false)
    native.lineTo(250, 350)
    native.quadraticCurveTo(200, 300, 150, 320)
    native.arcTo(100, 330, 100, 250, 40)
    native.lineTo(120, 180)
    native.closePath()

    if (p.showFill) {
      ctx.fillStyle = 'rgba(231,76,60,0.08)'
      ctx.fill(native)
      ctx.fillStyle = 'rgba(52,152,219,0.08)'
      ctx.fill(ourPath.toCanvasPath2D())
    }

    ctx.strokeStyle = '#e74c3c'
    ctx.lineWidth = p.strokeW
    ctx.stroke(native)

    ctx.strokeStyle = '#3498db'
    ctx.lineWidth = p.strokeW
    ctx.setLineDash([6, 4])
    ctx.stroke(ourPath.toCanvasPath2D())
    ctx.setLineDash([])

    ctx.fillStyle = '#e74c3c'
    ctx.font = '12px sans-serif'
    ctx.fillText('原生组合路径', 20, 30)
    ctx.fillStyle = '#3498db'
    ctx.fillText('Path2D 组合路径 (虚线)', 20, 48)

    ctx.canvas.addEventListener('mousedown',e=>{
        const rect=ctx.canvas.getBoundingClientRect()
        const sx=ctx.canvas.width/rect.width
        const sy=ctx.canvas.height/rect.height
        const x=(e.clientX-rect.left)*sx
        const y=(e.clientY-rect.top)*sy
        if(ourPath.contains(x,y)){
            console.log('点击了路径内')
        }
    })
  }),
]

// ── 当前状态 ──

const activeKey = ref(tests[0].key)
const currentTest = computed(() => tests.find(t => t.key === activeKey.value) || tests[0])

// 构建响应式参数
function buildParams(test: TestCase): Record<string, any> {
  const p: Record<string, any> = {}
  for (const [k, def] of Object.entries(test.params)) {
    p[k] = def.default
  }
  return p
}

const params = reactive(buildParams(currentTest.value))

// 切换测试时重置参数
watch(activeKey, (key) => {
  const test = tests.find(t => t.key === key) || tests[0]
  const newParams = buildParams(test)
  Object.assign(params, newParams)
})

function draw() {
  const ctx = canvas.value?.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  currentTest.value.draw(ctx, { ...params })
}

onMounted(() => {
  draw()
})
</script>

<template>
  <div style="padding:12px;font-family:'Segoe UI','PingFang SC',sans-serif;max-width:1400px">
    <!-- 顶部控制栏 -->
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:10px">
      <label style="font-weight:600;font-size:14px">测试用例:</label>
      <select v-model="activeKey" @change="draw"
        style="padding:4px 10px;font-size:14px;border:1px solid #ccc;border-radius:4px;min-width:200px">
        <option v-for="t in tests" :key="t.key" :value="t.key">{{ t.label }}</option>
      </select>
      <span style="font-size:12px;color:#e74c3c;margin-left:8px">红色实线 = 原生 Path2D</span>
      <span style="font-size:12px;color:#3498db">蓝色虚线 = 我们的 Path2D</span>
    </div>

    <!-- 参数面板 -->
    <div style="display:flex;gap:16px;flex-wrap:wrap">
      <div style="flex:1;min-width:200px;max-width:320px">
        <div style="background:#f8f9fa;border:1px solid #dee2e6;border-radius:6px;padding:12px">
          <div style="font-weight:600;font-size:13px;margin-bottom:8px;color:#495057">参数控制</div>
          <div v-for="(def, key) in currentTest.params" :key="key" style="margin-bottom:8px">
            <template v-if="def.type === 'number'">
              <div style="display:flex;justify-content:space-between;font-size:12px;color:#666">
                <label :for="'p_'+key">{{ def.label }}</label>
                <span>{{ params[key] }}</span>
              </div>
              <input :id="'p_'+key" type="range"
                :min="def.min ?? 0" :max="def.max ?? 100" :step="def.step ?? 1"
                v-model.number="params[key]" @input="draw"
                style="width:100%;margin:2px 0" />
            </template>
            <template v-else-if="def.type === 'boolean'">
              <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#666;cursor:pointer">
                <input type="checkbox" v-model="params[key]" @change="draw" />
                {{ def.label }}
              </label>
            </template>
          </div>
        </div>
      </div>
      <!-- 画布 -->
      <div style="flex:1;min-width:500px">
        <canvas ref="canvas" width="900" height="500"
          style="border:1px solid #dee2e6;border-radius:6px;width:100%"></canvas>
      </div>
    </div>
  </div>
</template>
