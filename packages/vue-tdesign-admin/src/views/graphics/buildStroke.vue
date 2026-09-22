<script setup lang="ts">
import { shallowRef, onMounted } from 'vue'
import { Element,type ElementProps,PointerEventSystem,ShapePath, glMatrix,createWebGLProgram, pixijs,normalizeAngles, curvePaths, PathBuilder,Vector2, tess2, earcut, BoundingRect } from '@dxyl/math2'
import GUI from "lil-gui"


const canvasRef = shallowRef<HTMLCanvasElement>()
class Circle {
    
    constructor(public cx:number,public cy:number,public radius:number){
        
    }
    hitTest(x:number,y:number):boolean{
        return (x-this.cx)**2+(y-this.cy)**2<=this.radius**2
    }
}
onMounted(()=>{
    const ctx=canvasRef.value?.getContext('2d')
    const scene=new Circle({radius:0})
    const pointer=new PointerEventSystem({
        target:canvasRef.value,
        screenToWorld:(out,x,y,element)=>{
            const rect=element.getBoundingClientRect()
            return out.set(x-rect.left,y-rect.top)
        },
        hitTest:(element,x,y)=>{
            for(let i=scene.children.length-1;i>=0;i--){
                const child=scene.children[i]
                if(child.hit(x,y)){
                    return child
                }
            }
            return null
        },
    })

})
</script>

<template>

    <canvas ref="canvasRef" width="500" height="500"></canvas>
</template>
