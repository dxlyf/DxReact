<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useTenantStore } from '@/store/tenant'
import { usePermissionStore } from '@/store/permission'
import Sidebar from './Sidebar.vue'
import HeaderBar from './Header.vue'

const route = useRoute()
const tenantStore = useTenantStore()
const permissionStore = usePermissionStore()

const sidebarMenus = computed(() => permissionStore.menus)
const activeMenu = computed(() => route.path)

</script>

<template>
  <t-layout class="app-layout">
    <t-aside class="app-sidebar">
      <div class="logo-container">
        <img
          :src="tenantStore.tenantLogo || '/favicon.svg'"
          class="app-logo"
          alt="logo"
        />
        <span class="title">{{ tenantStore.tenantName || '管理后台' }}</span>
      </div>
      <Sidebar :menus="sidebarMenus" :active="activeMenu" />
    </t-aside>

    <t-layout>
      <HeaderBar />
      <t-content class="app-content">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" :key="route.path" />
          </keep-alive>
        </router-view>
      </t-content>
    </t-layout>
  </t-layout>
</template>

<style scoped lang="scss">
.app-layout {
  height: 100vh;
}
.app-sidebar {
  width: 232px;
  background: var(--td-bg-color-container);
  border-right: 1px solid var(--td-border-level-1-color);
}
.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--td-border-level-1-color);
}
.app-logo {
  width: 32px;
  height: 32px;
}
.title {
  font-size: 18px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}
.app-content {
  padding: 24px;
  background: var(--td-bg-color-page);
  overflow-y: auto;
}
</style>
