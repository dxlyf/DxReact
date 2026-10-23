<script setup lang="ts">
import { shallowRef, onMounted } from 'vue'
import { PathBuilder } from '@dxyl/math2'
import { Pixmap, rasterization } from './engine/raster'

const canvasRef = shallowRef<HTMLCanvasElement>()

/** 每个像素放大成格子的边长（px） */
const CELL_SIZE = 12
/** 画布四周留白（px） */
const MARGIN = 10

function init() {
    const canvas = canvasRef.value
    if (!canvas) {
        return
    }

    // 1. 准备像素图（40 × 30 像素），先用 Pixmap 接口铺一层浅色背景
    const pixmap = new Pixmap(40, 30)
    pixmap.clear([245, 247, 250, 255])

    // 2. 构造闭合路径，顶点故意带小数，边缘不落在整像素上，便于观察抗锯齿
    const path = new PathBuilder()
    path.moveTo(10.5, 2)
    path.lineTo(30, 10)
    path.lineTo(10.5, 13)
    path.closePath()

    // 3. 灰度抗锯齿光栅化：覆盖率乘进 alpha 后混合进 pixmap
    rasterization(pixmap, path, [32, 96, 200, 255])

    // 4. 按 dpr 设置画布尺寸，再把 pixmap 放大成网格画出来
    const dpr = window.devicePixelRatio || 1
    const width = pixmap.width * CELL_SIZE + MARGIN * 2
    const height = pixmap.height * CELL_SIZE + MARGIN * 2
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) {
        return
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)
    // 每个数据像素画成一个格子，并叠加黑色网格线
    pixmap.drawGrid(ctx, CELL_SIZE, MARGIN)

    ctx.beginPath()
    ctx.lineWidth=1
    ctx.strokeStyle='#ff0000'
    const newPath=path.clone()
    newPath.transform([CELL_SIZE,0,0,CELL_SIZE,MARGIN,MARGIN])
    newPath.applyContext(ctx)
    ctx.stroke()
}

onMounted(init)
</script>

<template>
    <canvas ref="canvasRef"></canvas>
</template>
