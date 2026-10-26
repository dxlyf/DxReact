<script setup lang="ts">
import { shallowRef, onMounted } from 'vue'
import { PathBuilder } from '@dxyl/math2'
import { Pixmap, rasterization2 } from './engine/raster'
import { R } from 'vue-router/dist/router-CWoNjPRp.mjs'

const canvasRef = shallowRef<HTMLCanvasElement>()
// 1. 准备像素图（40 × 30 像素），先用 Pixmap 接口铺一层浅色背景
const pixmap = new Pixmap(40, 30)
/** 每个像素放大成格子的边长（px） */
const CELL_SIZE = 30
/** 画布四周留白（px） */
const MARGIN = 10
// 4. 按 dpr 设置画布尺寸，再把 pixmap 放大成网格画出来
const dpr = window.devicePixelRatio || 1
const width = pixmap.width * CELL_SIZE + MARGIN * 2
const height = pixmap.height * CELL_SIZE + MARGIN * 2
function worldToScreen(x: number, y: number) {
    return { x: (x*CELL_SIZE+MARGIN),y:(y*CELL_SIZE+MARGIN) }
}
function screenToWorld(x:number,y:number){
    return {x:((x-MARGIN)/CELL_SIZE),y:(y-MARGIN)/CELL_SIZE}
}
function render() {
    pixmap.clear([245, 247, 250, 255])

    // 2. 构造闭合路径，顶点故意带小数，边缘不落在整像素上，便于观察抗锯齿
    const path = new PathBuilder()
    for(let i=0;i<circles.length;i++){
        (path[i==0?'moveTo':'lineTo'])(circles[i].x,circles[i].y)
    }
    path.closePath()

    // 3. 灰度抗锯齿光栅化：覆盖率乘进 alpha 后混合进 pixmap
    rasterization2(pixmap, path, [32, 96, 200, 255])

    const canvas = canvasRef.value


    const ctx = canvas.getContext('2d')
    if (!ctx) {
        return
    }
    ctx.save()
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)
    // 每个数据像素画成一个格子，并叠加黑色网格线
    pixmap.drawGrid(ctx, CELL_SIZE, MARGIN)

    ctx.beginPath()
    ctx.lineWidth = 1
    ctx.strokeStyle = '#ff0000'
    const newPath = path.clone()
    newPath.transform([CELL_SIZE, 0, 0, CELL_SIZE, MARGIN, MARGIN])
    newPath.applyContext(ctx)
    ctx.stroke()

    ctx.beginPath()
    ctx.fillStyle = '#ff0000'
    circles.forEach(c => {
        const s=worldToScreen(c.x,c.y)
        ctx.moveTo(s.x,s.y)
        ctx.arc(s.x,s.y,5,0,Math.PI*2)
        ctx.closePath()
    })
    ctx.fill()
    ctx.restore()
}
const circles = [
    {
        x: 10.5,
        y: 2,
    },
    {
        x: 30,
        y: 10,
    },
    {
        x: 10.5,
        y: 13,
    }
]
function init() {
    const canvas = canvasRef.value
    if (!canvas) {
        return
    }


    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    render()
}
let rendering=false
let requestRender=()=>{
    if(rendering){
        return
    }
    rendering=true;
    requestAnimationFrame(()=>{
        render()
        rendering=false
    })
}
let downTarget=null,downOffset={x:0,y:0}
const handlePointer=(e:PointerEvent)=>{
    const type=e.type
    const rect=(e.target as HTMLCanvasElement).getBoundingClientRect()
    const x=e.clientX-rect.left
    const y=e.clientY-rect.top
    const wxy=screenToWorld(x,y)
    const hoverTarget=circles.find(c=>{
        const xy=worldToScreen(c.x,c.y)
        return ((x-xy.x)**2+(y-xy.y)**2)<=5**2
    })
    if(type==='pointerdown'){
        downTarget=hoverTarget;
        if(hoverTarget){
            downOffset.x=wxy.x-hoverTarget.x
            downOffset.y=wxy.y-hoverTarget.y
        }
        (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
    }else if(type==='pointermove'){
        if(downTarget){
            downTarget.x=wxy.x-downOffset.x
            downTarget.y=wxy.y-downOffset.y
            requestRender()
        }
    }else{
        downTarget=null;
        (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId)
    }
    
}
const handles={
    pointerdown:handlePointer,
    pointermove:handlePointer,
    pointerup:handlePointer
}
onMounted(init)
</script>

<template>
    <canvas ref="canvasRef" v-on="handles"></canvas>
</template>
