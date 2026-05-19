<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/store/app'
import AppLoading from '@/components/AppLoading.vue'

const appStore = useAppStore()
const { initialized } = storeToRefs(appStore)

onMounted(() => {
  appStore.initApp()
})
</script>

<template>
  <AppLoading v-if="!initialized" />
  <router-view v-else v-slot="{ Component }">
    <Transition name="fade" mode="out-in">
      <component :is="Component" />
    </Transition>
  </router-view>
</template>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
