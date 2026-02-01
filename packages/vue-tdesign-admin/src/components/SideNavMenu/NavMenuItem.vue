<template>
  <t-submenu v-if="Array.isArray(item.children)" :key="item.key" >
      <template #icon>
      <t-icon :name="item.icon"></t-icon>
    </template>
    <template #title>
      {{ item.title }}
    </template>
    <template #content>
      <nav-menu-item v-for="child in item.children" :key="child.key" :item="child" />
    </template>
  </t-submenu>
  <t-menu-item v-else :value="item.key" :to="item.path" >
    <template #icon>
      <t-icon :name="item.icon"></t-icon>
    </template>
    {{ item.title }}
    </t-menu-item>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import type { MenuItem } from 'src/stores/menu'

interface Props {
  item: MenuItem
}

const props = defineProps<Props>()
const route = useRoute()
defineOptions({
  name: 'NavMenuItem'
})
</script>