<script setup lang="ts">
import { computed, nextTick, onBeforeMount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()
/**
 * 用于强制刷新某个路由：
 * 1. 先跳转到空路由（/reload)
 * 2. 空路由跳转到目标路由（redirect）
 */
const redirect = computed(() => {
    return route.query.redirect as string
})
if (redirect.value) {
    router.replace({
        path: redirect.value
    })
}
const handleReturn = () => {
    router.replace({
        path: redirect.value
    })
}
</script>
<template>
    <button @click="handleReturn">返回</button>
</template>
