<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Context } from './engine/renderer/webgl/context'
const canvasRef = ref<HTMLCanvasElement>()



onMounted(() => {
    const gl = canvasRef.value?.getContext('webgl2')
    if (!gl) {
        return
    }
  


})
</script>
<template>
    <canvas ref="canvasRef" width="500" height="500"></canvas>
</template>