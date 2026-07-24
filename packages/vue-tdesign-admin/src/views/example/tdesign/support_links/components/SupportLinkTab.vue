<script setup lang="ts">
import { ref } from 'vue'
import SupportLinkItem from './SupportLinkItem.vue'
import type { SupportLinkItem as SupportLinkItemType } from './SupportLinkForm.vue'

const props = defineProps<{
  items: SupportLinkItemType[]
  tabLabel: string
  tabType: 'quick' | 'hot'
}>()

const emit = defineEmits<{
  update: [index: number, field: string, value: any]
  remove: [index: number]
  add: []
}>()

const itemRefs = ref<InstanceType<typeof SupportLinkItem>[]>([])

function setItemRef(el: any, index: number) {
  if (el) {
    itemRefs.value[index] = el
  }
}

function onItemUpdate(index: number, field: string, value: any) {
  emit('update', index, field, value)
}

function onItemRemove(index: number) {
  emit('remove', index)
}

function handleAdd() {
  emit('add')
}

async function validate(): Promise<boolean> {
  for (let i = 0; i < itemRefs.value.length; i++) {
    const valid = await itemRefs.value[i].validate()
    if (!valid) return false
  }
  return true
}

defineExpose({ validate })
</script>

<template>
  <div>
    <div style="margin-bottom: 16px; display: flex; justify-content: flex-end;">
      <t-button theme="primary" @click="handleAdd">
        创建{{ tabLabel }}
      </t-button>
    </div>

    <div v-if="items.length === 0" style="text-align: center; padding: 48px 0; color: #999;">
      <t-empty description="暂无数据" />
    </div>

    <SupportLinkItem
      v-for="(item, index) in items"
      :key="item.id"
      :ref="(el: any) => setItemRef(el, index)"
      :item="item"
      :index="index"
      :tab-label="tabLabel"
      @update="onItemUpdate"
      @remove="onItemRemove"
    />
  </div>
</template>
