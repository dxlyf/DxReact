<script setup lang="ts">
import { computed, markRaw } from 'vue'
import type { FormFieldConfig } from './types'
import JsonForm from './JsonForm.vue'
import { extraFieldTemplates, buildMergedFieldConfigs, updateArrayItem, moveArrayItem, deleteArrayItem, addArrayItem } from './utils'

const props = defineProps<{
  field: FormFieldConfig
  items: any[]
  data: Record<string, any>
  depth: number
  collapsedStates: Record<string, Record<number, boolean>>
}>()

const emit = defineEmits<{
  openAddFieldDialog: [field: FormFieldConfig, idx: number]
  toggleCollapse: [fieldKey: string, idx: number]
  change: []
  update: [val: Record<string, any>]
}>()

const JsonFormComp = markRaw(JsonForm)

const baseFields = computed(() => props.field.arrayConfig?.item?.fields || [])
const templates = computed(() => extraFieldTemplates(props.field))
</script>

<template>
  <div class="array-list-wrap">
    <div v-for="(item, idx) in items" :key="`${field.key}-${idx}`" class="array-list-item">
      <div class="array-list-item-header">
        <div class="flex items-center gap-1">
          <t-button variant="text" size="small" @click="emit('toggleCollapse', field.key, idx)">
            <t-icon :name="collapsedStates?.[field.key]?.[idx] ? 'chevron-right' : 'chevron-down'" />
          </t-button>
          <span class="text-xs font-medium">{{ field.label }} #{{ idx + 1 }}</span>
        </div>
        <div class="flex items-center gap-1">
          <t-button variant="text" size="small" @click="emit('openAddFieldDialog', field, idx)">
            <t-icon name="add" />
          </t-button>
          <t-button variant="text" size="small" @click="emit('update', moveArrayItem(field, idx, 'up', data))" :disabled="idx === 0">
            <t-icon name="chevron-up" />
          </t-button>
          <t-button variant="text" size="small" @click="emit('update', moveArrayItem(field, idx, 'down', data))" :disabled="idx === items.length - 1">
            <t-icon name="chevron-down" />
          </t-button>
          <t-button variant="text" size="small" @click="emit('update', deleteArrayItem(field, idx, data))">
            <t-icon name="delete" class="text-red-500" />
          </t-button>
        </div>
      </div>
      <div class="array-list-item-body" v-show="!collapsedStates?.[field.key]?.[idx]">
        <template v-if="field.arrayConfig?.item?.valueType === 'object'">
          <component
            :is="JsonFormComp"
            :schema="{ fields: buildMergedFieldConfigs(baseFields, templates, item) }"
            :model-value="item"
            :depth="depth + 1"
            @update:model-value="(val: Record<string, any>) => emit('update', updateArrayItem(field, idx, { ...val, _extraFields: item._extraFields, _extraFieldTypes: item._extraFieldTypes }, data))"
            @change="emit('change')"
          />
        </template>
        <template v-else-if="field.arrayConfig?.item?.options?.length">
          <t-select
            :model-value="item"
            @update:model-value="(val: any) => emit('update', updateArrayItem(field, idx, val, data))"
            clearable class="w-full"
          >
            <t-option v-for="opt in field.arrayConfig!.item!.options!" :key="opt.value" :value="opt.value" :label="opt.label" />
          </t-select>
        </template>
        <template v-else>
          <t-input
            :model-value="item"
            @update:model-value="(val: any) => emit('update', updateArrayItem(field, idx, val, data))"
            :placeholder="field.placeholder || `请输入第 ${idx + 1} 项`"
          />
        </template>
      </div>
    </div>
    <t-button variant="outline" size="small" class="mt-2" @click="emit('update', addArrayItem(field, data))">+ 添加{{ field.label }}</t-button>
  </div>
</template>

<style scoped>
.array-list-wrap {
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
.array-list-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: #f5f6f8;
  border-bottom: 1px solid #dfe1e6;
}
.array-list-item-body {
  padding: 12px;
}
</style>
