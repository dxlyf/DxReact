<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted } from 'vue';
import { GUI } from 'lil-gui'
import { Stats ,EventEmitter,curvePaths,type Vector2Like, Vector2} from '@dxyl/math2'
const canvasRef = shallowRef<HTMLCanvasElement>();

curvePaths.Curve.prototype.getStrokePoints=function(options:{width:number,cap:'butt'|'round'|'square',join:'round'|'bevel'|'miter'}){
   const points=this.getPoints()
   const newPoints:Vector2Like[]=[]
 
   let lastPoint:Vector2Like|undefined
   
   // 排除重复点
   for(let i=0;i<points.length;i++){
        const point=points[i]
        if(!lastPoint||!Vector2.equalsEpsilon(lastPoint,point,1e-3)){
            newPoints.push(point)
        }
        lastPoint=point
   }
   if(newPoints.length<2){
      return []
   }
   let newLength=newPoints.length
   let closed=Vector2.equalsEpsilon(newPoints[0],newPoints[newLength-1],1e-6)
   let leftPoints:Vector2Like[]=[]
   let rightPoints:Vector2Like[]=[]
   let processCap=(prev:Vector2,cur:Vector2,next:Vector2)=>{

   }
   let processJoin=(prev:Vector2,cur:Vector2,next:Vector2)=>{

   }
   let prev=Vector2.create()
   let cur=Vector2.create()
   let next=Vector2.create()
   let prevNormal=Vector2.create()
   let nextNormal=Vector2.create()

   let setNormal=(out,v0:Vector2,v1:Vector2)=>{
      prevNormal.copy(v0)
      nextNormal.copy(v1)
   }
   if(closed){

   }else{

      for(let i=0;i<newLength;i++){
         cur.copy(newPoints[i])
         // join
         if(i===0){
            // start cap
            next.copy(newPoints[i+1])

         }else if(i===newLength-1){
            // end cap
         }else{
            prev.copy(newPoints[i-1])
            next.copy(newPoints[i+1])
            // join
          //  processJoin(newPoints[i-1],newPoints[i],newPoints[i+1])
         }
      }
   }
   return leftPoints.concat(rightPoints)
}
onMounted(()=>{
    const ctx=canvasRef.value.getContext('2d')!
    
    const path=new curvePaths.Path()
    path.moveTo(100,100)
    path.lineTo(200,100)
    
    const points=path.getPoints()

    ctx.beginPath()
    
    for(let [index,point] of points.entries()){
        if(index===0){
            ctx.moveTo(point.x,point.y)
        }else{
             ctx.lineTo(point.x,point.y)
        }
    }

    ctx.stroke()

     const strokePoints=path.getStrokePoints({width:10,cap:'round',join:'bevel'})

    ctx.beginPath()
    
    for(let [index,point] of strokePoints.entries()){
        if(index===0){
            ctx.moveTo(point.x,point.y)
        }else{
             ctx.lineTo(point.x,point.y)
        }
    }

    ctx.stroke()

})
</script>
<template>
    <canvas ref="canvasRef" width="500" height="500"></canvas>
</template>