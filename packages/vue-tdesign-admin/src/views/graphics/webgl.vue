<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { GLContext } from './engine/types/gl'
const canvasRef = ref<HTMLCanvasElement>()



onMounted(() => {
    const gl = canvasRef.value?.getContext('webgl2')
    if (!gl) {
        return
    }
    const context = new GLContext(gl);

    const program = context.createProgram({
        vs: `#version 300 es
        void main() {
            gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
        }
        `,
        fs: `#version 300 es
        precision highp float;
        void main() {
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
        `
    })

    context.useProgram(program);

    context.disable('DEPTH_TEST')
    context.clear({
        color: [0, 0, 0, 1],
    })
    context.draw()



})
</script>
<template>
    <canvas ref="canvasRef" width="500" height="500"></canvas>
</template>