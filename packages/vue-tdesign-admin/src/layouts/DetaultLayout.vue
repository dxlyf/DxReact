<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import SideMenu from './components/SideMenu/index.vue'
import NavHeader from './components/NavHeader/index.vue'
import { useDefaultMenuStore } from '@/stores/defaultMenu'

defineOptions({
  name: 'DefaultLayout'
})

const route = useRoute()
const menuStore = useDefaultMenuStore()
const collapsed = ref(false)

menuStore.init()

function onMenuChange(key: string) {
  menuStore.setActiveKey(key)
}

function onMenuExpand(keys: string[]) {
  menuStore.setExpandedKeys(keys)
}

function syncRoute() {
  menuStore.syncByRoute(route.meta as Record<string, any>)
}

watch(() => route.path, syncRoute)
onMounted(syncRoute)

function onLogout() {
  console.log('logout')
}
</script>

<template>
  <div class="layout">
    <aside class="layout-side" :class="{ 'is-fold': collapsed }">
      <SideMenu
        :items="menuStore.items"
        :value="menuStore.activeKey"
        :expanded="menuStore.expandedKeys"
        :collapsed="collapsed"
        @change="onMenuChange"
        @expand="onMenuExpand"
        @update:collapsed="collapsed = $event"
      />
    </aside>
    <div class="layout-main">
      <NavHeader
        system-name="后台管理"
        @logout="onLogout"
      />
      <main class="layout-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
}

.layout-side {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 232px;
  transition: width 0.2s;
  background: #fff;
  z-index: 100;
}

.layout-side.is-fold {
  width: 64px;
}

.layout-main {
  margin-left: 232px;
  min-height: 100vh;
  background: #f5f6f8;
  transition: margin-left 0.2s;
}

.layout-side.is-fold ~ .layout-main {
  margin-left: 64px;
}

.layout-content {
  padding: 20px;
  padding-top: 76px;
}

.layout-main :deep(.navbar) {
  position: fixed;
  top: 0;
  left: 232px;
  right: 0;
  z-index: 99;
  transition: left 0.2s;
}

.layout-side.is-fold ~ .layout-main :deep(.navbar) {
  left: 64px;
}

.layout-content :deep(> *) {
  min-height: 0;
}
</style>
