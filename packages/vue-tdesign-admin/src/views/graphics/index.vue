<script setup lang="ts">
import { shallowRef,onMounted } from 'vue'
import {Path2D as StandPath2D} from './engine/math/2d/Path2D'
const canvasRef = shallowRef<HTMLCanvasElement>()


onMounted(()=>{
    const canvas= canvasRef.value
    canvas.width=500
    canvas.height=500
    const ctx= canvas.getContext('2d')


    let path2d=new Path2D()
    let standPath2d=new StandPath2D()
    const drawCircle=(p:Path2D|StandPath2D)=>{
      //  p.arc(200,200,100,0,Math.PI*2,false)
      p.moveTo(200,200)
      p.lineTo(300,200)
      p.lineTo(300,300)
    }
    drawCircle(path2d)
    drawCircle(standPath2d)

    ctx.fillStyle='#fff'
    ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height)
    ctx.beginPath()
    ctx.strokeStyle='#000'
    ctx.stroke(path2d)

    
    let points=standPath2d.strokePath({
        width:10,
        miterLimit:10,
        join:'miter',
        cap:'round'
    }).flatten(0.25)
    ctx.beginPath()
    
    ctx.strokeStyle='#0000ff'
    points.forEach((p,i)=>{
        if(i===0){
            ctx.moveTo(p.x,p.y)
        }else{
            ctx.lineTo(p.x,p.y)
        }
    })
    ctx.stroke()
    //standPath2d.stroke(ctx,'#0000ff',1)
})
</script>

<template>
    <canvas ref="canvasRef" ></canvas>
</template>
