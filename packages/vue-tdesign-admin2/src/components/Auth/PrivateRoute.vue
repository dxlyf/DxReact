<script setup lang="ts">
import { useRouter,useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const route=useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isLoggedIn = computed(() => authStore.isLoggedIn)

if (!isLoggedIn.value) {
  const redirect = router.currentRoute.value.fullPath
  router.replace({ name: 'Login', query: { redirect } })
}
</script>

<template>
  <slot v-if="isLoggedIn" />
</template>
