<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import type { ArrayFieldConfig, UpdateValueFn } from '../types'
import { UPDATE_VALUE_KEY } from '../types'
import { getDefaultValue } from '../utils'
import ArrayTabsMode from './ArrayTabsMode.vue'
import ArrayListMode from './ArrayListMode.vue'

const props = defineProps<{
  field: ArrayFieldConfig
  modelValue: any
  path: (string | number)[]
  /** 内联模式：modelValue 即为数组自身，不额外添加 field.key 到路径 */
  inline?: boolean
}>()

const updateValue = inject<UpdateValueFn>(UPDATE_VALUE_KEY)!
const inline = computed(() => props.inline === true)
const currentPath = computed(() => inline.value ? props.path : [...props.path, props.field.key])

const items = computed<any[]>(() => {
  const v = inline.value ? props.modelValue : props.modelValue?.[props.field.key]
  return Array.isArray(v) ? v : []
})

const canAdd = computed(() => props.field.added !== false)
const canRemove = computed(() => props.field.removable !== false)
const isMaxed = computed(() => props.field.maxItems != null && items.value.length >= props.field.maxItems!)
const collapsed = ref(false)

const itemFields = props.field.items?.fields || []

const addItem = () => {
  if (isMaxed.value) return
  const item: any = {}
  itemFields.forEach((f) => { item[f.key] = getDefaultValue(f) })
  updateValue(currentPath.value, [...items.value, item])
}
</script>

<template>
  <t-card
    :bordered="true"
    size="small"
    
  >
    <template #header>
      <div class="card-header-inner">
        <t-button variant="text" size="small" @click.stop="collapsed = !collapsed">
          <t-icon :name="collapsed ? 'chevron-down' : 'chevron-up'" />
        </t-button>
        <span class="card-title">
          <span v-if="field.required" class="text-red-500 mr-0.5">*</span>
          {{ field.label }}
        </span>
        <div class="card-header-spacer"></div>
        <t-button variant="base" size="small" @click="addItem" v-if="canAdd && !isMaxed">
          <template #icon><t-icon name="add" /></template> 添加子项
        </t-button>
      </div>
    </template>

    <div v-show="!collapsed">
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
  </t-card>
</template>

<style scoped>
.card-header-inner {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}
.card-title {
  font-size: 13px;
  font-weight: 500;
  color: #4e5969;
}
.card-header-spacer {
  flex: 1;
}
.field-help {
  display: block;
  font-size: 12px;
  color: #86909c;
  margin-top: 4px;
}
</style>
