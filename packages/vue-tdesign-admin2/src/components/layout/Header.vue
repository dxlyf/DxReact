<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { useTenantStore } from '@/store/tenant'
import TenantSwitcher from './TenantSwitcher.vue'

const router = useRouter()
const authStore = useAuthStore()
const tenantStore = useTenantStore()

async function handleLogout() {
  await authStore.logout()
  tenantStore.clearCurrentTenant()
  router.push({ name: 'Login' })
}
</script>

<template>
  <t-header class="app-header">
    <div class="header-left">
      <TenantSwitcher v-if="authStore.isSuperAdmin" />
    </div>
    <div class="header-right">
      <t-dropdown>
        <t-button variant="text">
          <t-avatar
            :image="authStore.user?.avatar"
            :alt="authStore.user?.nickname"
            size="small"
          />
          <span class="username">{{ authStore.user?.nickname || authStore.user?.username }}</span>
          <t-icon name="chevron-down" />
        </t-button>
        <template #dropdown>
          <t-dropdown-menu>
            <t-dropdown-item @click="router.push('/settings')">
              <t-icon name="setting" />
              租户设置
            </t-dropdown-item>
            <t-dropdown-item @click="handleLogout">
              <t-icon name="logout" />
              退出登录
            </t-dropdown-item>
          </t-dropdown-menu>
        </template>
      </t-dropdown>
    </div>
  </t-header>
</template>

<style scoped lang="scss">
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;
  background: var(--td-bg-color-container);
  border-bottom: 1px solid var(--td-border-level-1-color);
}
.header-left {
  display: flex;
  align-items: center;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.username {
  margin: 0 8px;
}
</style>
