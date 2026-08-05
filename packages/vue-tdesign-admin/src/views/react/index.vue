<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { createElement, createRoot } from './react19/lib/index'
import { App } from './react19/demo/app'
// React 渲染的 DOM 不带 Vue scoped 属性，demo 样式需全局引入
import './react19/demo/app.css'

const containerRef = ref<HTMLDivElement>()
let root: ReturnType<typeof createRoot> | null = null

onMounted(() => {
  if (containerRef.value) {
    root = createRoot(containerRef.value)
    root.render(createElement(App))
  }
})

onBeforeUnmount(() => {
  root?.unmount()
  root = null
})
</script>

<template>
  <div class="react19-page">
    <div ref="containerRef" class="react19-container" />
  </div>
</template>

<style scoped>
.react19-page {
  padding: 24px;
  background: #f9fafb;
  min-height: 100%;
}
.react19-container {
  max-width: 900px;
  margin: 0 auto;
}
</style>
