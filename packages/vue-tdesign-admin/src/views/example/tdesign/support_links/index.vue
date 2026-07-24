<script setup lang="ts">
import { reactive, ref } from 'vue'
import MainLayout from '@/views/example/tdesign/components/Layouts/MainLayout.vue'
import SupportLinkTab from './components/SupportLinkTab.vue'
import type { SupportLinkItem } from './components/SupportLinkForm.vue'

let nextId = 1

function createItem(isNew = true): SupportLinkItem {
  return {
    id: nextId++,
    isNew,
    title: '',
    type: 'relative',
    link: '',
    countries: [],
    publishStatus: 'draft',
    publishTime: '',
    sortOrder: 0,
  }
}

const quickLinks = reactive<SupportLinkItem[]>([])
const hotLinks = reactive<SupportLinkItem[]>([])

const activeTab = ref('quick')

const tabQuickRef = ref<InstanceType<typeof SupportLinkTab> | null>(null)
const tabHotRef = ref<InstanceType<typeof SupportLinkTab> | null>(null)

const breadcrumbOptions = [
  { content: '首页', to: '/' },
  { content: '支持链接管理' },
]

function onTabChange(value: string | number) {
  activeTab.value = value as string
}

function addQuickLink() {
  quickLinks.push(createItem())
}

function addHotLink() {
  hotLinks.push(createItem())
}

function updateItem(list: SupportLinkItem[], index: number, field: string, value: any) {
  (list[index] as any)[field] = value
}

function removeItem(list: SupportLinkItem[], index: number) {
  list.splice(index, 1)
}

function handleUpdate(list: SupportLinkItem[], index: number, field: string, value: any) {
  updateItem(list, index, field, value)
}

function handleRemove(list: SupportLinkItem[], index: number) {
  removeItem(list, index)
}

async function handleUpdateAll() {
  const tab = activeTab.value === 'quick' ? tabQuickRef.value : tabHotRef.value
  const valid = await tab?.validate()
  if (valid) {
    console.log('更新所有链接:', {
      quickLinks: JSON.parse(JSON.stringify(quickLinks)),
      hotLinks: JSON.parse(JSON.stringify(hotLinks)),
    })
  }
}
</script>

<template>
  <MainLayout layout="list" title="支持链接管理" :breadcrumb-options="breadcrumbOptions">
    <t-tabs :value="activeTab" @change="onTabChange">
      <t-tab-panel value="quick" label="快速链接">
        <SupportLinkTab
          ref="tabQuickRef"
          :items="quickLinks"
          tab-label="快速链接"
          tab-type="quick"
          @update="(i: number, f: string, v: any) => handleUpdate(quickLinks, i, f, v)"
          @remove="(i: number) => handleRemove(quickLinks, i)"
          @add="addQuickLink"
        />
      </t-tab-panel>

      <t-tab-panel value="hot" label="热门链接">
        <SupportLinkTab
          ref="tabHotRef"
          :items="hotLinks"
          tab-label="热门链接"
          tab-type="hot"
          @update="(i: number, f: string, v: any) => handleUpdate(hotLinks, i, f, v)"
          @remove="(i: number) => handleRemove(hotLinks, i)"
          @add="addHotLink"
        />
      </t-tab-panel>
    </t-tabs>

    <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
      <t-button theme="primary" @click="handleUpdateAll">更新</t-button>
    </div>
  </MainLayout>
</template>

<style scoped>
:deep(.t-tabs__content) {
  padding: 16px;
  background: #f5f5f5;
  border-radius: 0 0 6px 6px;
}
</style>
