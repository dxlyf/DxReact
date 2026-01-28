<template>
  <t-menu
    :value="activeMenu"
    @change="handleMenuChange"
    class="h-full"
  >
    <template v-for="item in menuItems" :key="item.path">
      <t-menu-item
        v-if="!item.children || item.children.length === 0"
        :value="item.path"
      >
        <template #icon>
          <t-icon :name="item.icon" />
        </template>
        {{ item.title }}
      </t-menu-item>
      
      <t-submenu
        v-else
        :value="item.path"
        :title="item.title"
      >
        <template #icon>
          <t-icon :name="item.icon" />
        </template>
        <t-menu-item
          v-for="child in item.children"
          :key="child.path"
          :value="child.path"
        >
          <template #icon>
            <t-icon :name="child.icon" />
          </template>
          {{ child.title }}
        </t-menu-item>
      </t-submenu>
    </template>
  </t-menu>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { MenuItem } from '../config/menu'

interface Props {
  menuItems: MenuItem[]
}

const props = defineProps<Props>()
const route = useRoute()
const router = useRouter()

const activeMenu = ref(route.path)

watch(() => route.path, (newPath) => {
  activeMenu.value = newPath
})

const handleMenuChange = (value: string) => {
  router.push(value)
}
</script>

<style scoped>
/* 自定义样式 */
</style>
