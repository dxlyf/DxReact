<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface TagItem {
  path: string
  title: string
  name: string
}

const route = useRoute()
const router = useRouter()

const tags = ref<TagItem[]>([
  { path: '/dashboard', title: '仪表盘', name: 'Dashboard' },
])
const activeTag = ref('')

function findTitle(route: any): string {
  return route.meta?.title || route.name as string || '未知'
}

function addTag(route: any) {
  const path = route.path
  const exists = tags.value.find(t => t.path === path)
  if (!exists) {
    tags.value.push({
      path,
      title: findTitle(route),
      name: route.name as string,
    })
  }
  activeTag.value = path
}

function handleClick(path: string) {
  activeTag.value = path
  router.push(path)
}

function handleClose(path: string, index: number) {
  tags.value.splice(index, 1)
  if (activeTag.value === path) {
    const target = tags.value[index] || tags.value[index - 1] || tags.value[0]
    if (target) {
      router.push(target.path)
    }
  }
}

function handleCloseOthers(index: number) {
  const current = tags.value[index]
  tags.value = [current]
  router.push(current.path)
}

function handleCloseAll() {
  tags.value = [{ path: '/dashboard', title: '仪表盘', name: 'Dashboard' }]
  router.push('/dashboard')
}

watch(
  () => route.path,
  (path) => {
    if (path && path !== '/login' && path !== '/forbidden') {
      addTag(route)
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="tags-bar">
    <t-tabs
      v-model="activeTag"
      :addable="false"
      :size="'small'"
      theme="card"
      @change="handleClick"
    >
      <t-tab-panel
        v-for="(tag, index) in tags"
        :key="tag.path"
        :value="tag.path"
        :label="tag.title"
        :closable="tags.length > 1"
        :remove-btn="true"
        @close="handleClose(tag.path, index)"
      >
        <template #actions>
          <t-dropdown
            trigger="context-menu"
            :on-click="(key: string) => {
              if (key === 'close-others') handleCloseOthers(index)
              if (key === 'close-all') handleCloseAll()
            }"
          >
            <span class="tag-actions" />
            <template #dropdown>
              <t-dropdown-menu>
                <t-dropdown-item value="close-others">关闭其他</t-dropdown-item>
                <t-dropdown-item value="close-all">关闭全部</t-dropdown-item>
              </t-dropdown-menu>
            </template>
          </t-dropdown>
        </template>
      </t-tab-panel>
    </t-tabs>
  </div>
</template>

<style scoped lang="scss">
.tags-bar {
  background: var(--td-bg-color-container);
  border-bottom: 1px solid var(--td-border-level-1-color);
  padding: 0 8px;

  :deep(.t-tabs) {
    --td-tab-item-height: 36px;
  }
  :deep(.t-tabs__header) {
    margin-bottom: 0;
  }
  :deep(.t-tabs__nav) {
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
}
.tag-actions {
  display: inline-block;
  width: 0;
  height: 100%;
}
</style>
