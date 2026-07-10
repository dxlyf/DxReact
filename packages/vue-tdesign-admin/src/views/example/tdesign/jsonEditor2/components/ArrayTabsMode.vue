<script setup lang="ts">
import { ref, inject, computed } from 'vue'
import type { ArrayFieldConfig, UpdateValueFn, ObjectFieldConfig } from '../types'
import { UPDATE_VALUE_KEY } from '../types'
import FieldRenderer from './FieldRenderer.vue'

const props = defineProps<{
  field: ArrayFieldConfig
  items: any[]
  path: (string | number)[]
  canRemove: boolean
  sortable: boolean
}>()

const updateValue = inject<UpdateValueFn>(UPDATE_VALUE_KEY)!
const activeTab = ref('0')

/** 将 items 配置转为 ObjectFieldConfig，用于 ObjectField 渲染 */
const itemObjectField = computed<ObjectFieldConfig>(() => ({
  ...(props.field.items || { valueType: 'object', key: '__item__' }),
}))

const removeItem = (idx: number) => {
  const newItems = props.items.filter((_, i) => i !== idx)
  updateValue(props.path, newItems)
  if (newItems.length) {
    activeTab.value = `${Math.min(idx, newItems.length - 1)}`
  } else {
    activeTab.value = '0'
  }
}

const moveItem = (idx: number, dir: 'up' | 'down') => {
  if (dir === 'up' && idx === 0) return
  if (dir === 'down' && idx === props.items.length - 1) return
  const arr = [...props.items]
  const target = dir === 'up' ? idx - 1 : idx + 1
  const [item] = arr.splice(idx, 1)
  arr.splice(target, 0, item)
  updateValue(props.path, arr)
  activeTab.value = `${target}`
}
</script>

<template>
  <div class="array-tabs">
    <t-tabs
      v-if="items.length"
      v-model="activeTab"
      placement="top"
      size="medium"
      @remove="(ctx) => removeItem(Number(ctx.value))"
    >
      <template #action v-if="sortable && items.length > 1">
        <t-button variant="text" size="small" :disabled="Number(activeTab) === 0" @click="moveItem(Number(activeTab), 'up')">
          <t-icon name="chevron-up" />
        </t-button>
        <t-button variant="text" size="small" :disabled="Number(activeTab) === items.length - 1" @click="moveItem(Number(activeTab), 'down')">
          <t-icon name="chevron-down" />
        </t-button>
      </template>
      <t-tab-panel
        v-for="(item, idx) in items"
        :key="idx"
        :value="`${idx}`"
        :label="`${field.label || '项'} #${idx + 1}`"
        :removable="canRemove"
      >
        <div class="tab-content">
          <FieldRenderer
            :field="itemObjectField"
            :model-value="{ [itemObjectField.key || '__item__']: item }"
            :path="[...path, idx]"
          />
        </div>
      </t-tab-panel>
    </t-tabs>
  </div>
</template>

<style scoped>
.array-tabs {
  border: 1px solid #dfe1e6;
  border-radius: 8px;
  padding: 8px 12px 12px;
  background: #fafafa;
}
.tab-content {
  padding-top: 12px;
}
</style>
