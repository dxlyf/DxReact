<script setup lang="ts">
import { onMounted, shallowRef } from 'vue';

const root = shallowRef<HTMLDivElement>()

onMounted(() => {
  // 动态加载 Mini React Concurrent 库
  const script = document.createElement('script')
  script.src = '/src/views/react/reactLike/react.js'
  script.type = 'module'
  root.value?.appendChild(script)
})
</script>
<template>
  <div class="react-concurrent-container">
    <h2 style="text-align:center;padding:20px;color:#1677ff;">
      Mini React Concurrent - 请直接打开 index.html 查看完整 Demo
    </h2>
    <p style="text-align:center;color:#999;">
      完整 Demo 路径: <code>reactLike/index.html</code> — 包含6个并发特性演示
    </p>
    <iframe
      src="/src/views/react/reactLike/index.html"
      style="width:100%;height:calc(100vh - 40px);border:none;margin-top:12px;"
    />
  </div>
</template>