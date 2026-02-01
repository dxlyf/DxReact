<template>
  <div class="flex flex-1 bg-gray-50">
    <!-- 侧边栏 -->
    <aside class="w-64 box-border bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div class="p-4 box-border h-14 border-b border-gray-200">
        <h1 class="text-xl font-bold text-blue-600">后台管理系统</h1>
      </div>
      <div class="flex-1 overflow-y-auto">
        <SideNavMenu :menuItems="menuData" class="!w-full"/>
      </div>
      <div class="p-4 border-t border-gray-200">
        <div class="flex items-center">
          <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
            {{ userStore.userInfo.name.charAt(0) }}
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium">{{ userStore.userInfo.name }}</p>
            <p class="text-xs text-gray-500">{{ userStore.userInfo.role }}</p>
          </div>
        </div>
      </div>
    </aside>
    <!-- 主内容区 -->
    <div class="flex-1 flex flex-col">
      <!-- 顶部导航栏 -->
      <header class="h-14 z-20 sticky w-full top-0 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div class="flex items-center">
          <button class="text-gray-500 mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <h2 class="text-lg font-medium">{{ $route.meta.title }}</h2>
        </div>
        <div class="flex items-center space-x-4">
          <button class="text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="m21 12-4.3-4.3a2 2 0 0 0-2.8 0L6 12"></path>
            </svg>
          </button>
          <button class="text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>
        </div>
      </header>
      <!-- 标签页 -->
      <div class="bg-white border-b sticky top-14 border-gray-200 px-4">
        <t-tabs
          :value="tabsStore.activeTab"
          @change="handleTabChange"
          theme="card"
          :addable="false"
        >
          <t-tab-panel
            v-for="tab in tabsStore.tabs"
            :key="tab.path"
            :value="tab.path"
            :label="tab.title"
            :removable="tab.closable"
            @remove="handleTabRemove(tab.path)"
          />
        </t-tabs>
      </div>
      
      <!-- 内容区域 -->
      <main class="flex-1 p-6">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" :key="$route.path" />
          </keep-alive>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch,computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useTabsStore } from '../stores/tabs'
import SideNavMenu from '../components/SideNavMenu/index.vue'
import { useMenu } from 'src/stores/menu'

const userStore = useUserStore()
const tabsStore = useTabsStore()
const route = useRoute()
const router = useRouter()
const menuStore = useMenu()
const menuData=computed(()=>menuStore.menuData)
const handleTabChange = (value: string) => {
  tabsStore.setActiveTab(value)
  router.push(value)
}

const handleTabRemove = (path: string) => {
  const wasActive = tabsStore.activeTab === path
  tabsStore.removeTab(path)
  if (wasActive && tabsStore.activeTab) {
    router.push(tabsStore.activeTab)
  }
}

const addCurrentRouteTab = () => {
  if (route.meta.title) {
    tabsStore.addTab({
      path: route.path,
      name: route.name as string,
      title: route.meta.title as string,
      closable: route.path !== '/dashboard'
    })
  }
}

watch(() => route.path, () => {
  addCurrentRouteTab()
}, { immediate: true })

onMounted(() => {
  addCurrentRouteTab()
})
</script>

<style scoped>
/* 自定义样式 */
</style>
