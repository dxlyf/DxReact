<script setup lang="ts">
import { shallowRef, onMounted } from 'vue'
import { Element,type ElementProps,PointerEventSystem,ShapePath, glMatrix,createWebGLProgram, pixijs,normalizeAngles, curvePaths, PathBuilder,Vector2, tess2, earcut, BoundingRect } from '@dxyl/math2'
import GUI from "lil-gui"

const canvasRef = shallowRef<HTMLCanvasElement>()

onMounted(()=>{
    const ctx=canvasRef.value?.getContext('2d')
    

})
</script>

<template>

    <canvas ref="canvasRef" width="500" height="500"></canvas>
</template>
