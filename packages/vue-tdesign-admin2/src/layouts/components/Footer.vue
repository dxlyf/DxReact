<script setup lang="ts">
import { useTenantStore } from '@/store/tenant'

const tenantStore = useTenantStore()
const year = new Date().getFullYear()
const appName = computed(() => tenantStore.tenantName || '管理后台')
</script>

<template>
  <t-footer class="layout-footer">
    <span class="footer-text">
      &copy; {{ year }} {{ appName }}. All rights reserved.
    </span>
  </t-footer>
</template>

<style scoped lang="scss">
.layout-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  background: var(--td-bg-color-container);
  border-top: 1px solid var(--td-border-level-1-color);
  flex-shrink: 0;
}
.footer-text {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
}
</style>
