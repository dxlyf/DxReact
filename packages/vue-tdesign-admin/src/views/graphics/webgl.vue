<script setup lang="ts">
    import { onMounted, ref } from 'vue'
    import {GLContext } from './engine/types/gl'
    const canvasRef = ref<HTMLCanvasElement>()

   

    onMounted(() => {
        const gl = canvasRef.value?.getContext('webgl2')
        if (!gl) {
            return
        }
        const context = new GLContext(gl);

        const program=context.compileProgram(``,``)

        context.useProgram(program);

        context.enable('DEPTH_TEST')


  
    })
</script>
<template>
        <canvas ref="canvasRef" width="500" height="500"></canvas>
</template>