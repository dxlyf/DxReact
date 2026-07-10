<script setup lang="ts">
import { computed, inject } from 'vue'
import type { ArrayFieldConfig, UpdateValueFn } from '../types'
import { UPDATE_VALUE_KEY } from '../types'
import { getDefaultValue } from '../utils'
import ArrayTabsMode from './ArrayTabsMode.vue'
import ArrayListMode from './ArrayListMode.vue'

const props = defineProps<{
  field: ArrayFieldConfig
  modelValue: any
  path: (string | number)[]
}>()

const updateValue = inject<UpdateValueFn>(UPDATE_VALUE_KEY)!
const currentPath = [...props.path, props.field.key]

const items = computed<any[]>(() => {
  const v = props.modelValue?.[props.field.key]
  return Array.isArray(v) ? v : []
})

const canAdd = computed(() => props.field.added !== false)
const canRemove = computed(() => props.field.removable !== false)
const isMaxed = computed(() => props.field.maxItems != null && items.value.length >= props.field.maxItems!)

const itemFields = props.field.items?.fields || []

const addItem = () => {
  if (isMaxed.value) return
  const item: any = {}
  itemFields.forEach((f) => { item[f.key] = getDefaultValue(f) })
  updateValue(currentPath, [...items.value, item])
}
</script>

<template>
  <div class="array-field">
    <div class="array-label-row" v-if="field.label">
      <label class="field-label">
        <span v-if="field.required" class="text-red-500 mr-0.5">*</span>
        {{ field.label }}
      </label>
      <t-button
        v-if="canAdd && !isMaxed"
        variant="outline"
        size="small"
        @click="addItem"
      >
        <t-icon name="add" /> 添加{{ field.label || '项' }}
      </t-button>
    </div>

    <ArrayTabsMode
      v-if="field.displayType === 'tabs'"
      :field="field"
      :items="items"
      :path="currentPath"
      :can-remove="canRemove"
      :sortable="field.sortable !== false"
    />
    <ArrayListMode
      v-else
      :field="field"
      :items="items"
      :path="currentPath"
      :can-remove="canRemove"
      :sortable="field.sortable !== false"
    />

    <span class="field-help" v-if="field.help">{{ field.help }}</span>
  </div>
</template>

<style scoped>
.array-field {
  margin-bottom: 16px;
}
.array-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.array-label-row .field-label {
  margin-bottom: 0;
}
.field-label {
  display: block;
  font-size: 13px;
  color: #4e5969;
  font-weight: 500;
}
.field-help {
  display: block;
  font-size: 12px;
  color: #86909c;
  margin-top: 4px;
}
</style>
