<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/store/app'
import { useTenantStore } from '@/store/tenant'
import { usePermissionStore } from '@/store/permission'
import HeaderBar from './components/Header.vue'
import TagsBar from './components/TagsBar.vue'
import Breadcrumb from './components/Breadcrumb.vue'
import FooterBar from './components/Footer.vue'
import type { MenuItem as MenuItemType } from '@/types/menu'
import MenuItem from './components/MenuItem.vue'

const route = useRoute()
const router = useRouter()
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

const topMenus = computed(() => menus.value)

const currentTopMenu = ref<MenuItemType | null>(null)

const sidebarMenus = computed(() => {
  return currentTopMenu.value?.children ?? []
})

watch(
  () => route.path,
  (path) => {
    const matched = menus.value.find(m => path.startsWith(m.path) || m.children?.some(c => path.startsWith(c.path)))
    if (matched) {
      currentTopMenu.value = matched
    } else if (topMenus.value.length > 0) {
      currentTopMenu.value = topMenus.value[0]
    }
  },
  { immediate: true },
)

function handleTopMenuClick(menu: MenuItemType) {
  currentTopMenu.value = menu
  if (menu.children?.length) {
    const target = menu.children.find(c => !c.hidden)
    if (target) {
      router.push(target.path)
    }
  }
}
</script>

<template>
  <t-layout class="mix-layout">
    <t-header class="mix-topbar">
      <div class="topbar-left">
        <img
          :src="tenantStore.tenantLogo || '/favicon.svg'"
          class="app-logo"
          alt="logo"
        />
        <span class="title">{{ tenantStore.tenantName || '管理后台' }}</span>
      </div>
      <div class="topbar-menu">
        <t-menu
          :value="currentTopMenu?.path || ''"
          theme="dark"
          :expand-type="'popup'"
        >
          <t-menu-item
            v-for="item in topMenus"
            :key="item.id"
            :value="item.path"
            @click="handleTopMenuClick(item)"
          >
            <template #icon>
              <t-icon v-if="item.icon" :name="item.icon" />
            </template>
            {{ item.title }}
          </t-menu-item>
        </t-menu>
      </div>
      <div class="topbar-right">
        <HeaderBar />
      </div>
    </t-header>

    <t-layout class="mix-body">
      <t-aside v-if="sidebarMenus.length" class="mix-sidebar" :class="{ collapsed }">
        <t-menu
          :value="activeMenu"
          :collapsed="collapsed"
          class="sidebar-menu"
        >
          <MenuItem
            v-for="item in sidebarMenus"
            :key="item.id"
            :item="item"
          />
        </t-menu>
      </t-aside>

      <t-layout class="mix-main">
        <TagsBar />
        <t-content class="mix-content">
          <div class="content-header">
            <Breadcrumb />
          </div>
          <div class="content-body">
            <router-view v-slot="{ Component }">
              <keep-alive>
                <component :is="Component" :key="route.path" />
              </keep-alive>
            </router-view>
          </div>
        </t-content>
        <FooterBar />
      </t-layout>
    </t-layout>
  </t-layout>
</template>

<style scoped lang="scss">
.mix-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.mix-topbar {
  display: flex;
  align-items: center;
  height: 56px;
  background: var(--td-brand-color);
  padding: 0 24px;
  z-index: 100;
}
.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 32px;
  flex-shrink: 0;
}
.app-logo {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}
.title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
}
.topbar-menu {
  flex: 1;
  overflow: hidden;

  :deep(.t-menu) {
    background: transparent;
  }
  :deep(.t-menu__item) {
    color: rgba(255, 255, 255, 0.85);
    &:hover,
    &.t-is-active {
      color: #fff;
      background: rgba(255, 255, 255, 0.15);
    }
  }
}
.topbar-right {
  flex-shrink: 0;

  :deep(.t-button) {
    color: #fff;
  }
}
.mix-body {
  flex: 1;
  overflow: hidden;
}
.mix-sidebar {
  width: 232px;
  background: var(--td-bg-color-container);
  border-right: 1px solid var(--td-border-level-1-color);
  transition: width 0.2s;
  overflow-y: auto;

  &.collapsed {
    width: 64px;
  }
}
.sidebar-menu {
  border-right: none;
}
.mix-main {
  display: flex;
  flex-direction: column;
}
.mix-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 24px;
  background: var(--td-bg-color-page);
  overflow-y: auto;
}
.content-header {
  flex-shrink: 0;
}
.content-body {
  flex: 1;
}
</style>
