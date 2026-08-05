<script setup lang="ts">
import { effect, onMounted, reactive, ref, shallowRef } from 'vue';
/**
 * 四种填充方式（实现在独立文件中）：
 *   SSAA     —— fillScanlineSSAA.ts：扫描线 + 超采样抗锯齿（8×8 子采样，采样近似）
 *   Cairo    —— fillCairo.ts：扫描线跨度 + 解析像素覆盖率（Q24.8 定点，不采样）
 *   Skia     —— fillSkia.ts：解析边缘覆盖率（SkFixed 16.16，边缘 ramp + 内部全填）
 *   FreeType —— fillFreetype.ts：精确 cell 覆盖 + 纯定点 26.6（ftgrays 灰度风格）
 */
import { fillPolygonSSAA } from './fillScanlineSSAA'
import { fillPolygonCairo } from './fillCairo'
import { fillPolygonSkia } from './fillSkia'
import { fillPolygonFreeType } from './fillFreetype'

type FillMode = 'ssaa' | 'cairo' | 'skia' | 'freetype'
const fillMode = ref<FillMode>('freetype')
const FILL_COLOR = { r: 255, g: 64, b: 64 }

const canvasRef = ref<HTMLCanvasElement>()
let ctxRef = shallowRef<CanvasRenderingContext2D>()
let refreshState = ref(false)
let viewport = reactive({
    width: 600,
    height: 600,
    dpr: window.devicePixelRatio,
})
const gridSetting = { rows: 10, cols: 10, size: 50, margin: 20 }

type Label = { x: number, y: number, label: string, color: string, offsetX: number, offsetY: number }
const labels: Label[] = []
let tmpAnchor: Label | null = null
const imageBuffer = new ImageData(gridSetting.rows, gridSetting.cols)

const worldToScreen = (x: number, y: number) => {
    return {
        x: x * gridSetting.size + gridSetting.margin,
        y: y * gridSetting.size + gridSetting.margin
    }
}
const screenToWorld = (x: number, y: number) => {
    return {
        x: (x - gridSetting.margin) / gridSetting.size,
        y: (y - gridSetting.margin) / gridSetting.size
    }
}
const refresh = () => {
    refreshState.value = !refreshState.value
}

const drawGrid = () => {
    const ctx = ctxRef.value!
    ctx.save()
    ctx.beginPath()
    ctx.translate(gridSetting.margin, gridSetting.margin)
    ctx.lineWidth = 1
    ctx.strokeStyle = '#000'
    for (let i = 0; i <= gridSetting.rows; i++) {
        ctx.moveTo(0, i * gridSetting.size)
        ctx.lineTo(gridSetting.size * gridSetting.cols, i * gridSetting.size)
    }
    for (let i = 0; i <= gridSetting.cols; i++) {
        ctx.moveTo(i * gridSetting.size, 0)
        ctx.lineTo(i * gridSetting.size, gridSetting.size * gridSetting.rows)
    }
    ctx.stroke()
    ctx.restore()
}
const drawBuffer = () => {
    const ctx = ctxRef.value!
    ctx.save()
    ctx.beginPath()
    // ctx.translate(gridSetting.margin,gridSetting.margin)
    const data = imageBuffer.data
    for (let y = 0; y < imageBuffer.height; y++) {
        for (let x = 0; x < imageBuffer.width; x++) {
            const index = (y * imageBuffer.width + x) * 4
            const r = data[index]
            const g = data[index + 1]
            const b = data[index + 2]
            const a = data[index + 3]
            if (a === 0) {
                continue
            }
            ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`
            const screen = worldToScreen(x, y)
            ctx.fillRect(screen.x, screen.y, gridSetting.size, gridSetting.size)
        }
    }

    ctx.stroke()
    ctx.restore()
}
const drawPoints = () => {
    const ctx = ctxRef.value!
    ctx.save()
    let newLabels: Label[] = tmpAnchor ? labels.concat(tmpAnchor) : labels
    for (let i = 0; i < newLabels.length; i++) {
        const label = newLabels[i]
        const screen = worldToScreen(label.x, label.y)

        ctx.beginPath()
        ctx.arc(screen.x, screen.y, 5, 0, Math.PI * 2)
        ctx.fillStyle = label.color
        ctx.fill()

        ctx.beginPath()
        ctx.fillStyle = '#000'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'start'
        ctx.textBaseline = 'middle'
        ctx.fillText(label.label, screen.x + label.offsetX, screen.y - label.offsetY)


    }
    ctx.beginPath()
    ctx.lineWidth=1
  for (let i = 0; i < labels.length; i++) {
        const label = labels[i]
        const screen = worldToScreen(label.x, label.y)
        if(i===0){
            ctx.moveTo(screen.x,screen.y)
        }else{
            ctx.lineTo(screen.x,screen.y)
        }
        
  }
    ctx.closePath()
    ctx.strokeStyle = '#0000ff'
    ctx.stroke()
    ctx.restore()
}
onMounted(() => {

    canvasRef.value.width = Math.round(viewport.width * viewport.dpr)
    canvasRef.value.height = Math.round(viewport.height * viewport.dpr)
    canvasRef.value.style.width = viewport.width + 'px'
    canvasRef.value.style.height = viewport.height + 'px'
    ctxRef.value = canvasRef.value?.getContext('2d')
    if (viewport.dpr !== 1) {
        ctxRef.value?.scale(viewport.dpr, viewport.dpr)
    }
})
const renderCanvas = () => {
    const ctx = ctxRef.value!
    ctx.clearRect(0, 0, viewport.width, viewport.height)
    ctx.save()
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, viewport.width, viewport.height)
    drawGrid()
    drawBuffer()
    drawPoints()
    ctx.restore()
    renderId = 0
}
let renderId = 0
const requestRenderCanvas = () => {
    if (renderId) {
        return
    }
    renderId = requestAnimationFrame(renderCanvas)
}
effect(() => {
    refreshState.value
    if (ctxRef.value) {
        requestRenderCanvas()
    }
})
const handleMouseDown = (e: MouseEvent) => {
    //  const rect=canvasRef.value.getBoundingClientRect()

    if (tmpAnchor) {

        labels.push({
            ...tmpAnchor,
            color: 'red',

        })
        tmpAnchor = null
        refresh()
    }
}
const handleMouseMove = (e: MouseEvent) => {
    const rect = canvasRef.value.getBoundingClientRect()
    const worldX = e.clientX - rect.left
    const worldY = e.clientY - rect.top
    const world = screenToWorld(worldX, worldY)
    if (world.x >= 0 && world.x <= gridSetting.cols && world.y >= 0 && world.y <= gridSetting.rows) {

        const tx = Math.trunc(world.x)
        const ty = Math.trunc(world.y)
        const epsilon = 0.1
        if (Math.abs(tx - world.x) < epsilon && Math.abs(ty - world.y) < epsilon) {
            tmpAnchor = {
                x: tx,
                y: ty,
                offsetX: 5,
                offsetY: 0,
                color: 'rgba(255,0,0,0.5)',
                label: `(${tx},${ty})`
            }
            refresh()
            return
        } else {
            tmpAnchor = {
                x: world.x,
                y: world.y,
                offsetX: 5,
                offsetY: 0,
                color: 'rgba(255,0,0,0.5)',
                label: `(${world.x},${world.y})`
            }
            refresh()
            return
        }

    }
    if (tmpAnchor) {
        tmpAnchor = null
        refresh()
    }
}

const handleFillPolygon = () => {
    if (labels.length < 3) {
        return // 多边形至少 3 个顶点
    }
    imageBuffer.data.fill(0)
    const vertices = labels.map(d => ({ x: d.x, y: d.y }))
    if (fillMode.value === 'ssaa') {
        fillPolygonSSAA(vertices, imageBuffer, FILL_COLOR)
    } else if (fillMode.value === 'cairo') {
        fillPolygonCairo(vertices, imageBuffer, FILL_COLOR)
    } else if (fillMode.value === 'skia') {
        fillPolygonSkia(vertices, imageBuffer, FILL_COLOR)
    } else {
        fillPolygonFreeType(vertices, imageBuffer, FILL_COLOR)
    }
    refresh()
}
const clearPolygon=()=>{
    imageBuffer.data.fill(0)
    labels.length=0
    refresh()
}
</script>
<template>
    <div class="flex flex-col gap-2">
        <t-radio-group v-model="fillMode" variant="default-filled">
            <t-radio-button value="ssaa">SSAA 超采样</t-radio-button>
            <t-radio-button value="cairo">Cairo 解析覆盖</t-radio-button>
            <t-radio-button value="skia">Skia 边缘解析</t-radio-button>
            <t-radio-button value="freetype">FreeType 灰度</t-radio-button>
        </t-radio-group>
        <div class="flex gap-2">
            <t-button theme="primary" @click="handleFillPolygon">填充多边形</t-button>
            <t-button theme="primary" @click="clearPolygon">清除多边形</t-button>
        </div>
    </div>
    <canvas ref="canvasRef" @mousedown="handleMouseDown" @mousemove="handleMouseMove"></canvas>
</template>
