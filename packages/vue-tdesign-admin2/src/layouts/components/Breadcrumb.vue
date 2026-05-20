<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter ,type RouteLocationNormalizedLoadedGeneric} from 'vue-router'

interface BreadcrumbItem {
  title: string
  path?: string
}

const route = useRoute()
const router = useRouter()
const breadcrumbs = ref<BreadcrumbItem[]>([])

function buildBreadcrumbs(route: RouteLocationNormalizedLoadedGeneric): BreadcrumbItem[] {
  const matched = route.matched.filter((r) => r.path)
  const items: BreadcrumbItem[] = matched.map((r: any) => ({
    title: r.meta?.title || r.name || '未知',
    path: r.path === '/' ? undefined : r.path,
  }))
  if (items.length > 0 && items[0].title === '未知') {
    items[0].title = '首页'
  }
  return items
}

function handleClick(item: BreadcrumbItem) {
  if (item.path) {
    router.push(item.path)
  }
}

watch(
  () => route.path,
  () => {
    breadcrumbs.value = buildBreadcrumbs(route)
  },
  { immediate: true },
)
</script>

<template>
  <t-breadcrumb class="layout-breadcrumb">
    <t-breadcrumbItem
      v-for="(item, index) in breadcrumbs"
      :key="index"
      :disabled="!item.path"
      @click="handleClick(item)"
    >
      {{ item.title }}
    </t-breadcrumbItem>
  </t-breadcrumb>
</template>

<style scoped lang="scss">
.layout-breadcrumb {
  padding: 12px 0;
}
</style>
