<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAppStore } from '@/store/app'
import Sidebar from './components/Sidebar.vue'
import HeaderBar from './components/Header.vue'
import Breadcrumb from './components/Breadcrumb.vue'
import FooterBar from './components/Footer.vue'

const route = useRoute()
const appStore = useAppStore()

const collapsed = computed(() => appStore.sidebarCollapsed)
</script>

<template>
  <t-layout class="default-layout">
    <t-aside class="layout-sidebar" :class="{ collapsed }">
      <Sidebar />
    </t-aside>

    <t-layout class="layout-main">
      <HeaderBar />

      <t-content class="layout-content">
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
</template>

<style scoped lang="scss">
.default-layout {
  height: 100vh;
}
.layout-sidebar {
  width: 232px;
  transition: width 0.2s;
  overflow: hidden;
  background: var(--td-bg-color-container);

  &.collapsed {
    width: 64px;
  }
}
.layout-main {
  display: flex;
  flex-direction: column;
}
.layout-content {
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
