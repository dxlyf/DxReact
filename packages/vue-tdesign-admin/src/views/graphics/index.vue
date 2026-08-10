<script setup lang="ts">
import { shallowRef,onMounted } from 'vue'

const containerRef = shallowRef<HTMLDivElement>()


onMounted(()=>{
    const containerDom= containerRef.value

})
</script>

<template>
    <div ref="containerRef" ></div>
</template>