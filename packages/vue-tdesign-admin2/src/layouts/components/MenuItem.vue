<script setup lang="ts">
import type { MenuItem } from '@/types/menu'

defineOptions({ name: 'MenuItem' })

const props = defineProps<{
  item: MenuItem
}>()

const hasChildren = computed(() => {
  return (props.item.children?.length ?? 0) > 0
})
</script>

<template>
  <t-submenu
    v-if="hasChildren"
    :value="item.path"
    :title="item.title"
  >
    <template #icon>
      <t-icon v-if="item.icon" :name="item.icon" />
    </template>
    <MenuItem
      v-for="child in item.children!"
      :key="child.id"
      :item="child"
    />
  </t-submenu>
  <t-menu-item v-else :value="item.path" :to="item.path">
    <template #icon>
      <t-icon v-if="item.icon" :name="item.icon" />
    </template>
    {{ item.title }}
  </t-menu-item>
</template>
