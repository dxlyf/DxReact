<script setup lang="ts">
import { ref, computed } from 'vue'
import type { MenuItem } from './types'
import MenuItemNode from './MenuItemNode.vue'

export type { MenuItem }

defineOptions({
  name: 'SideMenu'
})

const props = withDefaults(defineProps<{
  items: MenuItem[]
  value?: string
  expanded?: string[]
  collapsed?: boolean
}>(), {
  value: '',
  expanded: () => [],
  collapsed: false
})

const emit = defineEmits<{
  change: [val: string]
  expand: [val: string[]]
  'update:collapsed': [val: boolean]
}>()

const showCollapse = ref(false)

const collapsed = computed(() => props.collapsed)

function onChange(val: string | number) {
  emit('change', String(val))
}

function onExpand(val: (string | number)[]) {
  emit('expand', val.map(String))
}

function toggle() {
  emit('update:collapsed', !collapsed.value)
}
</script>

<template>
  <div
    class="side-menu-container"
    @mouseenter="showCollapse = true"
    @mouseleave="showCollapse = false"
  >
    <div
      class="side"
      :class="{ 'is-collapsed': collapsed }"
    >
      <div class="side-logo">
        <slot name="logo">
          <span class="side-logo-text">后台管理</span>
        </slot>
      </div>

      <div class="side-menu-wrap">
        <t-menu
          :value="value"
          :expanded="expanded"
          :collapsed="collapsed"
          theme="light"
          @change="onChange"
          @expand="onExpand"
        >
          <MenuItemNode :items="items" />
        </t-menu>
      </div>
    </div>

    <div
      class="side-collapse-zone"
      :class="{ 'is-visible': showCollapse }"
      @click="toggle"
    >
      <span class="side-collapse-bar" />
      <t-icon class="side-collapse-icon" :name="collapsed ? 'chevron-right' : 'chevron-left'" />
    </div>
  </div>
</template>

<style scoped>
.side-menu-container {
  position: relative;
  height: 100%;
  overflow: visible;
}

.side {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  transition: width 0.2s;
  width: 232px;
  overflow: hidden;
}

.side.is-collapsed {
  width: 64px;
}

.side-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid #ebedf0;
  flex-shrink: 0;
}

.side-logo-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--td-brand-color, #3355ff);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.is-collapsed .side-logo-text {
  font-size: 14px;
}

.side-menu-wrap {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.side-menu-wrap :deep(.t-menu) {
  height: 100%;
  border: none;
}

.side-collapse-zone {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  z-index: 20;
  width: 20px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.side-collapse-zone.is-visible {
  opacity: 1;
}

.side-collapse-bar {
  position: absolute;
  inset: 6px 2px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.06);
  transition: background 0.2s;
}

.side-collapse-zone:hover .side-collapse-bar {
  background: var(--td-brand-color, #3355ff);
  color: #fff;
}

.side-collapse-icon {
  position: relative;
  z-index: 1;
  font-size: 12px;
  color: #999;
  transition: color 0.2s;
}

.side-collapse-zone:hover .side-collapse-icon {
  color: var(--td-brand-color, #3355ff);
   color: #fff;
}
</style>
