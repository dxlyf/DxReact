<script setup lang="ts">
import { computed } from 'vue'
import { hasPermission } from '@/directives/permission'
import type { MenuItem } from './types'

defineOptions({
  name: 'MenuItemNode'
})

const props = defineProps<{
  items: MenuItem[]
}>()


</script>

<template>
  <template v-for="item in items" :key="item.menuKey || item.path">
    <t-submenu
      v-if="item.children && item.children.length"
      :value="item.menuKey || item.path || ''"
    >
      <template #icon>
        <t-icon v-if="item.icon" :name="item.icon" />
      </template>
      <template #title>
        {{ item.menuName }}
      </template>
      <MenuItemNode :items="item.children" />
    </t-submenu>
    <t-menu-item
      v-else
      :value="item.menuKey || item.path || ''"
      :to="item.path"
    >
      <template #icon>
        <t-icon v-if="item.icon" :name="item.icon" />
      </template>
      {{ item.menuName }}
    </t-menu-item>
  </template>
</template>
