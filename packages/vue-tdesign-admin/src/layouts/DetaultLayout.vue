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
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.layout-side {
  flex-shrink: 0;
  width: 232px;
  transition: width 0.2s;
  overflow: hidden;
  background: #fff;
}

.layout-side.is-fold {
  width: 64px;
}

.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #f5f6f8;
}

.layout-content {
  flex: 1;
  padding: 20px;
  overflow: auto;
}
</style>
