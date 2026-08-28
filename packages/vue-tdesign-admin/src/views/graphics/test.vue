<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted } from 'vue';

const canvasref = shallowRef<HTMLCanvasElement>();
onMounted(() => {
    const ctx = canvasref.value.getContext('2d')
    let g = ctx.createRadialGradient(-20, 50, 50, 50, 50, 0)
    g.addColorStop(0, '#ff0000')
    g.addColorStop(0.5, '#00ff00')
    g.addColorStop(1, '#0000ff')
    ctx.fillStyle = g
    ctx.translate(100,0)
    ctx.fillRect(0, 0, 100, 100)
})
</script>
<template>
    <canvas ref="canvasref" width="500" height="500"></canvas>
</template>