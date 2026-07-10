<script setup lang="ts">
import { computed, markRaw } from 'vue'
import type { FormFieldConfig } from './types'
import JsonForm from './JsonForm.vue'
import { extraFieldTemplates, buildMergedFieldConfigs } from './utils'

const props = defineProps<{
  field: FormFieldConfig
  items: any[]
  data: Record<string, any>
  depth: number
  activeTab: string
}>()

const emit = defineEmits<{
  update: [val: Record<string, any>]
  tabRemove: [idx: number]
  addItem: []
  openAddFieldDialog: [field: FormFieldConfig, idx: number]
  change: []
  'update:activeTab': [val: string]
}>()

const JsonFormComp = markRaw(JsonForm)

const baseFields = computed(() => props.field.arrayConfig?.item?.fields || [])
const templates = computed(() => extraFieldTemplates(props.field))
</script>

<template>
  <div class="array-tabs-wrap">
    <t-button v-if="!items.length" variant="outline" size="small" block @click="emit('addItem')">+ 添加{{ field.label }}</t-button>

    <t-tabs
      v-else
      :model-value="activeTab"
      @update:model-value="(val: string) => emit('update:activeTab', val)"
      theme="card"
      @remove="(ctx) => emit('tabRemove', Number(ctx.value))"
    >
      <t-tab-panel
        v-for="(item, idx) in items"
        :key="`${field.key}-${idx}`"
        :value="`${idx}`"
        :label="`${field.label} #${idx + 1}`"
        :removable="true"
      >
        <div class="pt-3">
          <template v-if="field.arrayConfig?.item?.valueType === 'object'">
            <component
              :is="JsonFormComp"
              :schema="{ fields: buildMergedFieldConfigs(baseFields, templates, item) }"
              :model-value="item"
              :depth="depth + 1"
              @update:model-value="(val: Record<string, any>) => emit('update', { ...data, [field.key]: items.map((it, i) => i === idx ? { ...val, _extraFields: it._extraFields, _extraFieldTypes: it._extraFieldTypes } : it) })"
              @change="emit('change')"
            />
          </template>
          <template v-else-if="field.arrayConfig?.item?.options?.length">
            <t-select
              :model-value="item"
              @update:model-value="(val: any) => emit('update', { ...data, [field.key]: items.map((it, i) => i === idx ? val : it) })"
              clearable class="w-full"
            >
              <t-option v-for="opt in field.arrayConfig!.item!.options!" :key="opt.value" :value="opt.value" :label="opt.label" />
            </t-select>
          </template>
          <template v-else>
            <t-input
              :model-value="item"
              @update:model-value="(val: any) => emit('update', { ...data, [field.key]: items.map((it, i) => i === idx ? val : it) })"

              :placeholder="field.placeholder || `请输入第 ${idx + 1} 项`"
            />
          </template>
        </div>
      </t-tab-panel>

      <template #action>
        <div class="array-tabs-actions">
          <t-button
            v-if="templates.length"
            variant="text"
            size="small"
            shape="round"
            @click="emit('openAddFieldDialog', field, Number(activeTab))"
          >
            <t-icon name="file-add" />
            添加字段
          </t-button>
          <t-button variant="text" size="small" shape="round" @click="emit('addItem')">
            <t-icon name="add" />
            添加项
          </t-button>
        </div>
      </template>
    </t-tabs>
  </div>
</template>

<style scoped>
.array-tabs-wrap {
  width: 100%;
}
.array-tabs-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
