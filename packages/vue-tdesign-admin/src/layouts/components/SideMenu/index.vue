<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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
const searchKeyword = ref('')

const collapsed = computed(() => props.collapsed)

function filterMenuItems(items: MenuItem[], keyword: string): MenuItem[] {
  if (!keyword) return items
  const lowerKeyword = keyword.toLowerCase()
  return items.reduce<MenuItem[]>((result, item) => {
    const matchName = item.menuName?.toLowerCase().includes(lowerKeyword)
    if (item.children && item.children.length) {
      const filteredChildren = filterMenuItems(item.children, keyword)
      if (matchName || filteredChildren.length) {
        result.push({
          ...item,
          children: filteredChildren.length ? filteredChildren : item.children
        })
      }
    } else if (matchName) {
      result.push(item)
    }
    return result
  }, [])
}

const filteredItems = computed(() => filterMenuItems(props.items, searchKeyword.value))

function collectExpandKeys(items: MenuItem[]): string[] {
  return items.reduce<string[]>((keys, item) => {
    if (item.children && item.children.length) {
      keys.push(item.menuKey || item.path || '')
      keys.push(...collectExpandKeys(item.children))
    }
    return keys
  }, [])
}

const localExpanded = ref<string[]>([])

watch(() => props.expanded, (val) => {
  localExpanded.value = [...val]
}, { immediate: true })

function collectParentKeys(items: MenuItem[], targetKey: string, parents: string[] = []): string[] | null {
  for (const item of items) {
    const currentKey = item.menuKey || item.path || ''
    if (currentKey === targetKey) {
      return parents
    }
    if (item.children?.length) {
      const result = collectParentKeys(item.children, targetKey, [...parents, currentKey])
      if (result) return result
    }
  }
  return null
}

const activeExpanded = computed(() => {
  if (searchKeyword.value) {
    return collectExpandKeys(filteredItems.value)
  }
  return localExpanded.value
})

function onChange(val: string | number) {
  const strVal = String(val)
  const parentKeys = collectParentKeys(props.items, strVal)
  if (parentKeys) {
    localExpanded.value = [...new Set([...localExpanded.value, ...parentKeys])]
  }
  emit('change', strVal)
}

function onExpand(val: (string | number)[]) {
  const strVals = val.map(String)
  if (!searchKeyword.value) {
    localExpanded.value = strVals
  }
  emit('expand', strVals)
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

      <div class="side-search" :class="{ 'is-hidden': collapsed }">
        <t-input
          v-model="searchKeyword"
          placeholder="搜索菜单"
          clearable
          :style="{ width: '100%' }"
        >
          <template #prefix-icon>
            <t-icon name="search" />
          </template>
        </t-input>
      </div>

      <div class="side-menu-wrap">
        <t-menu
          :value="value"
          :expanded="activeExpanded"
          :collapsed="collapsed"
          :expand-mutex="false"
          theme="light"
          @change="onChange"
          @expand="onExpand"
        >
          <MenuItemNode :items="filteredItems" />

           <template #operations>
        <t-button variant="text" shape="square" @click="toggle">
          <template #icon><t-icon name="view-list" /></template>
        </t-button>
      </template>
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

.side-search {
  padding: 8px 12px;
  border-bottom: 1px solid #ebedf0;
  flex-shrink: 0;
}

.side-search.is-hidden {
  visibility: hidden;
  height: 0;
  padding: 0 12px;
  border-bottom: none;
  overflow: hidden;
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
