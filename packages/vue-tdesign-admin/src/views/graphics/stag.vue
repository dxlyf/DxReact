<script setup lang="ts">
import { shallowRef,onMounted } from 'vue'

const canvasRef = shallowRef<HTMLCanvasElement>()

</script>
<template>
    <canvas ref="canvasRef"></canvas>
</template>