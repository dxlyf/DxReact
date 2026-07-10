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
const collapsed = ref<Set<number>>(new Set())

/** 将 items 配置转为 ObjectFieldConfig，用于 ObjectField 渲染 */
const itemObjectField = computed<ObjectFieldConfig>(() => ({
  ...(props.field.items || { valueType: 'object', key: '__item__' }),
}))

/** 该项是否支持添加字段 */
const canAddField = computed(() => itemObjectField.value.addedProperty !== false)

// 各 FieldRenderer 的 ref，用于触发 ObjectField 的添加字段 dialog
const fieldRefs = ref<Record<number, InstanceType<typeof FieldRenderer>>>({})
const setFieldRef = (idx: number) => (el: any) => {
  if (el) fieldRefs.value[idx] = el
}

const openAddFieldFor = (idx: number) => {
  fieldRefs.value[idx]?.openObjectAddDialog()
}

const toggleCollapse = (idx: number) => {
  const s = new Set(collapsed.value)
  if (s.has(idx)) s.delete(idx)
  else s.add(idx)
  collapsed.value = s
}

const removeItem = (idx: number) => {
  updateValue(props.path, props.items.filter((_, i) => i !== idx))
}

const moveItem = (idx: number, dir: 'up' | 'down') => {
  if (dir === 'up' && idx === 0) return
  if (dir === 'down' && idx === props.items.length - 1) return
  const arr = [...props.items]
  const target = dir === 'up' ? idx - 1 : idx + 1
  const [item] = arr.splice(idx, 1)
  arr.splice(target, 0, item)
  updateValue(props.path, arr)
}
</script>

<template>
  <div class="array-list">
    <div
      v-for="(item, idx) in items"
      :key="idx"
      class="array-list-item"
    >
      <div class="item-header">
        <div class="flex items-center gap-1">
          <t-button variant="text" size="small" @click="toggleCollapse(idx)">
            <t-icon :name="collapsed.has(idx) ? 'chevron-right' : 'chevron-down'" />
          </t-button>
          <span class="text-xs font-medium">{{ field.label || '项' }} #{{ idx + 1 }}</span>
        </div>
        <div class="flex items-center gap-0.5">
          <t-button
            v-if="canAddField"
            variant="text"
            size="small"
            @click.stop="openAddFieldFor(idx)"
          >
            <t-icon name="add" />
          </t-button>
          <t-button
            v-if="sortable"
            variant="text"
            size="small"
            :disabled="idx === 0"
            @click="moveItem(idx, 'up')"
          >
            <t-icon name="chevron-up" />
          </t-button>
          <t-button
            v-if="sortable"
            variant="text"
            size="small"
            :disabled="idx === items.length - 1"
            @click="moveItem(idx, 'down')"
          >
            <t-icon name="chevron-down" />
          </t-button>
          <t-button
            v-if="canRemove"
            variant="text"
            size="small"
            @click="removeItem(idx)"
          >
            <t-icon name="delete" class="text-red-500" />
          </t-button>
        </div>
      </div>

      <div class="item-body" v-show="!collapsed.has(idx)">
        <FieldRenderer
          ref="setFieldRef(idx)"
          :field="itemObjectField"
          :model-value="{ [itemObjectField.key || '__item__']: item }"
          :path="[...path, idx]"
          hide-object-header
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.array-list {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 12px;
  background: #fafafa;
}
.array-list-item {
  border: 1px solid #dfe1e6;
  border-radius: 6px;
  margin-bottom: 8px;
  background: #fff;
  overflow: hidden;
}
.array-list-item:last-child {
  margin-bottom: 0;
}
.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: #f5f6f8;
  border-bottom: 1px solid #dfe1e6;
}
.item-body {
  padding: 12px;
}
</style>
