<script setup lang="ts">
</script>

<template>
  <div class="app-loading">
    <div class="app-loading-content">
      <div class="app-loading-spinner">
        <svg
          class="loading-circular"
          viewBox="0 0 50 50"
        >
          <circle
            class="loading-circular-path"
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="currentColor"
            stroke-width="4"
            stroke-linecap="round"
          />
        </svg>
      </div>
      <div class="app-loading-text">应用加载中...</div>
    </div>
  </div>
</template>

<style scoped>
.app-loading {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--td-bg-color-page, #f5f5f5);
}

.app-loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.app-loading-spinner {
  width: 40px;
  height: 40px;
}

.loading-circular {
  animation: loading-rotate 1.5s linear infinite;
  width: 100%;
  height: 100%;
}

.loading-circular-path {
  stroke: var(--td-brand-color, #0052d9);
  stroke-dasharray: 2, 200;
  stroke-dashoffset: 0;
  animation: loading-dash 1.5s ease-in-out infinite;
}

.app-loading-text {
  font-size: 14px;
  color: var(--td-text-color-secondary, #999);
}

@keyframes loading-rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes loading-dash {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 200;
    stroke-dashoffset: -35px;
  }
  100% {
    stroke-dashoffset: -125px;
  }
}
</style>
