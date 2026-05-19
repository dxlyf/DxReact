<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="error-page">
    <t-result
      theme="warning"
      title="租户已过期"
      description="您的租户订阅已过期，请联系管理员续费"
    >
      <template #default>
        <t-button theme="primary" @click="router.push('/login')">
          重新登录
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
