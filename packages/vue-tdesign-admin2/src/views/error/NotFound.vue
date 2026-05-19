<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="error-page">
    <t-result
      theme="404"
      title="404"
      description="抱歉，您访问的页面不存在"
    >
      <template #default>
        <t-button theme="primary" @click="router.push('/')">
          返回首页
        </t-button>
      </template>
    </t-result>
  </div>
</template>

<style scoped lang="scss">
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
</style>
