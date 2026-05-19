<script setup lang="ts">
import type { MenuItem } from '@/types/menu'

const props = defineProps<{
  menus: MenuItem[]
  active: string
}>()
</script>

<template>
  <t-menu :value="props.active" class="sidebar-menu">
    <template v-for="item in props.menus.filter(m => !m.hidden)" :key="item.id">
      <t-submenu v-if="item.children?.length" :value="item.path" :title="item.title">
        <template #icon>
          <t-icon v-if="item.icon" :name="item.icon" />
        </template>
        <template v-for="child in item.children.filter(c => !c.hidden)" :key="child.id">
          <t-menu-item :value="child.path" :to="child.path">
            <template #icon>
              <t-icon v-if="child.icon" :name="child.icon" />
            </template>
            {{ child.title }}
          </t-menu-item>
        </template>
      </t-submenu>
      <t-menu-item v-else :value="item.path" :to="item.path">
        <template #icon>
          <t-icon v-if="item.icon" :name="item.icon" />
        </template>
        {{ item.title }}
      </t-menu-item>
    </template>
  </t-menu>
</template>

<style scoped lang="scss">
.sidebar-menu {
  border-right: none;
}
</style>
