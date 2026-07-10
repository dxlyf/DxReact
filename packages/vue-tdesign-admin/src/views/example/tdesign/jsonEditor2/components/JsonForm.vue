<script setup lang="ts">
import { computed, provide } from 'vue'
import type { ObjectFieldConfig, ArrayFieldConfig, UpdateValueFn } from '../types'
import { UPDATE_VALUE_KEY } from '../types'
import { setInPath, getDefaultValue } from '../utils'
import FieldRenderer from './FieldRenderer.vue'
import ArrayTabsMode from './ArrayTabsMode.vue'
import ArrayListMode from './ArrayListMode.vue'

const props = defineProps<{
  schema: ObjectFieldConfig | ArrayFieldConfig
  modelValue: any
}>()
const emit = defineEmits<{
  'update:modelValue': [value: any]
  change: [value: any]
}>()

const updateValue: UpdateValueFn = (path: (string | number)[], value: any) => {

  const newVal = setInPath(props.modelValue, path, value)
  emit('update:modelValue', newVal)
  emit('change', newVal)
}
provide(UPDATE_VALUE_KEY, updateValue)

const isArray = computed(() => props.schema.valueType === 'array')

// 顶层 array 配置
const arraySchema = computed<ArrayFieldConfig>(() => props.schema as ArrayFieldConfig)
const items = computed<any[]>(() => {
  const v = props.modelValue
  return Array.isArray(v) ? v : []
})
const canAdd = computed(() => arraySchema.value.added !== false)
const canRemove = computed(() => arraySchema.value.removable !== false)
const isMaxed = computed(() => arraySchema.value.maxItems != null && items.value.length >= arraySchema.value.maxItems!)

const rootItemFields = computed(() => arraySchema.value.items?.fields || [])
const addRootItem = () => {
  if (isMaxed.value) return
  const item: any = {}
  rootItemFields.value.forEach((f) => { item[f.key] = getDefaultValue(f) })
  updateValue([], [...items.value, item])
}
</script>

<template>
  <div class="json-form-v2">
    <!-- 顶层 object -->
    <FieldRenderer
      v-if="!isArray"
      :field="(schema as ObjectFieldConfig)"
      :model-value="modelValue"
      :path="[]"
    />

    <!-- 顶层 array -->
    <div v-else class="json-form-array-root">
      <div class="array-label-row" v-if="arraySchema.label">
        <label class="field-label">{{ arraySchema.label }}</label>
        <t-button
          v-if="canAdd && !isMaxed"
          variant="outline"
          size="small"
          @click="addRootItem"
        >
          <t-icon name="add" /> 添加{{ arraySchema.label || '项' }}
        </t-button>
      </div>

      <ArrayTabsMode
        v-if="arraySchema.displayType === 'tabs'"
        :field="arraySchema"
        :items="items"
        :path="[]"
        :can-remove="canRemove"
        :sortable="arraySchema.sortable !== false"
      />
      <ArrayListMode
        v-else
        :field="arraySchema"
        :items="items"
        :path="[]"
        :can-remove="canRemove"
        :sortable="arraySchema.sortable !== false"
      />

      <span class="field-help" v-if="arraySchema.help">{{ arraySchema.help }}</span>
    </div>
  </div>
</template>

<style scoped>
.json-form-v2 {
  width: 100%;
}
.json-form-array-root {
  margin-bottom: 0;
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
