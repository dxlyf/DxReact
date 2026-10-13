<script setup lang="ts">
import { shallowRef, onMounted } from 'vue'
import { PathBuilder,Vector2,type Vector2Like } from '@dxyl/math2'

import GUI from "lil-gui"

const canvasRef = shallowRef<HTMLCanvasElement>()

function addPolygon(out:Vector2Like[],points:Vector2Like[]){
    const result:Vector2Like[]=[]
    for(let i=0;i<points.length;i++){
        result.push({x:points[i].x,y:points[i].y})
    }
    if(!Vector2.equals(result[0],result[result.length-1])){
        result.push({
            x:result[result.length-1].x,
            y:result[result.length-1].y
        })
    }
    return result
}

function buildStroke(polygons:Vector2Like[][],options:{width:number}){
    const out:Vector2Like[][]=[]
    for(let polygon of polygons){

    }
    return out
}
onMounted(()=>{
    const ctx=canvasRef.value?.getContext('2d')
    const path=PathBuilder.default()

    path.rect(100,100,100,100)
    path.applyContext(ctx)
    ctx.stroke()
})
</script>

<template>

    <canvas ref="canvasRef" width="500" height="500"></canvas>
</template>
