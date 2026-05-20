<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAppStore } from '@/store/app'
import { useTenantStore } from '@/store/tenant'
import { usePermissionStore } from '@/store/permission'
import type { MenuItem as MenuItemType } from '@/types/menu'
import MenuItem from './MenuItem.vue'

const route = useRoute()
const appStore = useAppStore()
const tenantStore = useTenantStore()
const permissionStore = usePermissionStore()

const collapsed = computed(() => appStore.sidebarCollapsed)
const activeMenu = computed(() => route.path)

function filterVisible(items: MenuItemType[]): MenuItemType[] {
  return items
    .filter(m => !m.hidden)
    .map(m => ({
      ...m,
      children: m.children ? filterVisible(m.children) : undefined,
    }))
}

const menus = computed(() => filterVisible(permissionStore.menus))
</script>

<template>
  <div class="sidebar-container" :class="{ collapsed }">
    <div class="logo-container">
      <img
        :src="tenantStore.tenantLogo || '/favicon.svg'"
        class="app-logo"
        alt="logo"
      />
      <span v-show="!collapsed" class="title">{{ tenantStore.tenantName || '管理后台' }}</span>
    </div>
    <t-menu
      :value="activeMenu"
      :collapsed="collapsed"
      class="sidebar-menu"
    >
      <MenuItem
        v-for="item in menus"
        :key="item.id"
        :item="item"
      />
    </t-menu>
  </div>
</template>

<style scoped lang="scss">
.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 232px;
  background: var(--td-bg-color-container);
  border-right: 1px solid var(--td-border-level-1-color);
  transition: width 0.2s;
  overflow: hidden;

  &.collapsed {
    width: 64px;
  }
}
.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--td-border-level-1-color);
  flex-shrink: 0;
}
.app-logo {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}
.title {
  font-size: 18px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  white-space: nowrap;
}
.sidebar-menu {
  flex: 1;
  overflow-y: auto;
  border-right: none;
  ::-webkit-scrollbar {
    width: 4px;
  }
}
</style>
