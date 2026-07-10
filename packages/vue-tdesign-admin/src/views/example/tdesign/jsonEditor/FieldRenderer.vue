<script setup lang="ts">
import { markRaw, ref, computed } from 'vue'
import type { FormFieldConfig } from './types'
import JsonForm from './JsonForm.vue'
import ArrayTabsMode from './ArrayTabsMode.vue'
import ArrayListMode from './ArrayListMode.vue'
import AddFieldDialog from './AddFieldDialog.vue'
import {
  getDefaultValue, resolveCustomComponent, deleteArrayItem, addArrayItem,
  buildMergedFieldConfigs, objectTemplates,
} from './utils'

const props = defineProps<{
  field: FormFieldConfig
  /** The data object containing this field's value */
  data: Record<string, any>
  /** The key used to update the parent. Emitted with this key + the full new data */
  dataKey: string
  depth: number
  /** Only for array tabs mode */
  activeArrayTab: string
  collapsedStates: Record<string, Record<number, boolean>>
  /** Whether this field uses per-field updates (plain) or whole-object updates (groups) */
  plainUpdate: boolean
}>()

const emit = defineEmits<{
  /** Plain mode: (fieldKey, newValue). Groups mode: (instanceKey, newFullData) */
  fieldUpdate: [key: string, val: any]
  change: []
  openAddFieldDialog: [field: FormFieldConfig, idx: number, data: Record<string, any>, dataKey: string]
  toggleCollapse: [fieldKey: string, idx: number]
  updateActiveArrayTab: [tabValue: string]
}>()

const JsonFormComp = markRaw(JsonForm)

// ====== 对象字段的额外字段支持 ======
const objFieldDialogVisible = ref(false)

const objectMergedFields = computed(() => {
  if (props.field.valueType !== 'object') return props.field.objectConfig?.fields || []
  const obj = props.data[props.field.key] ?? {}
  return buildMergedFieldConfigs(
    props.field.objectConfig?.fields || [],
    objectTemplates(props.field),
    obj,
  )
})

const onObjectUpdate = (val: Record<string, any>) => {
  // 只在已有 _extraFields 时才保留，避免注入 undefined
  const prev = props.data[props.field.key]
  const merged = { ...val }
  if (prev?._extraFields) merged._extraFields = prev._extraFields
  if (prev?._extraFieldTypes) merged._extraFieldTypes = prev._extraFieldTypes
  onFieldUpdate(props.field.key, merged)
}

const onObjectAddFieldConfirm = (_key: string, val: any) => {
  // val 已经是更新后的完整对象
  onFieldUpdate(props.field.key, val)
  objFieldDialogVisible.value = false
}

// Handle array tabs add item
const handleAddArrayItem = () => {
  const newData = addArrayItem(props.field, props.data)
  const newIdx = (newData[props.field.key] || []).length - 1
  if (props.plainUpdate) {
    emit('fieldUpdate', props.field.key, newData[props.field.key])
  } else {
    emit('fieldUpdate', props.dataKey, newData)
  }
  emit('updateActiveArrayTab', `${newIdx}`)
}

const handleArrayTabsRemove = (idx: number) => {
  const newData = deleteArrayItem(props.field, idx, props.data)
  if (props.plainUpdate) {
    emit('fieldUpdate', props.field.key, newData[props.field.key])
  } else {
    emit('fieldUpdate', props.dataKey, newData)
  }
  // Activate the previous tab, or empty if none left
  const remaining = (newData[props.field.key] || []).length
  emit('updateActiveArrayTab', remaining > 0 ? `${Math.min(idx, remaining - 1)}` : '')
}

const handleArrayUpdate = (newData: Record<string, any>) => {
  if (props.plainUpdate) {
    emit('fieldUpdate', props.field.key, newData[props.field.key])
  } else {
    emit('fieldUpdate', props.dataKey, newData)
  }
}

// For groups mode: field update needs to reconstruct { ...data, [fieldKey]: val }
// For plain mode: emit field key directly
const onFieldUpdate = (fieldKey: string, val: any) => {
  emit('fieldUpdate', props.plainUpdate ? fieldKey : props.dataKey, props.plainUpdate ? val : { ...props.data, [fieldKey]: val })
}
</script>

<template>
  <template v-if="field.component">
    <div class="json-form-field" :class="[field.className, field.span ? `col-span-${field.span}` : '']">
      <label class="json-form-label" v-if="field.label">{{ field.label }}</label>
      <component
        :is="resolveCustomComponent(field.component)"
        :model-value="data[field.key] ?? getDefaultValue(field)"
        @update:model-value="(val: any) => onFieldUpdate(field.key, val)"
        v-bind="field.component.props || {}"
      />
      <span class="json-form-help" v-if="field.help">{{ field.help }}</span>
    </div>
  </template>

  <!-- string -->
  <template v-else-if="field.valueType === 'string'">
    <div class="json-form-field" :class="[field.className, field.span ? `col-span-${field.span}` : '']">
      <label class="json-form-label">{{ field.label }}</label>
      <template v-if="field.options?.length">
        <t-select
          :model-value="data[field.key] ?? ''"
          @update:model-value="(val: any) => onFieldUpdate(field.key, val)"
          :placeholder="field.placeholder"
          :multiple="field.multiple"
          clearable class="w-full"
        >
          <t-option v-for="opt in field.options" :key="opt.value" :value="opt.value" :label="opt.label" />
        </t-select>
      </template>
      <template v-else-if="field.stringConfig?.textarea">
        <t-textarea
          :model-value="data[field.key] ?? ''"
          @update:model-value="(val: any) => onFieldUpdate(field.key, val)"
          :placeholder="field.placeholder"
          :maxlength="field.stringConfig?.maxlength"
          :show-limit-number="field.stringConfig?.showLimitNumber"
          :rows="field.stringConfig?.rows || 3"
        />
      </template>
      <template v-else>
        <t-input
          :model-value="data[field.key] ?? ''"
          @update:model-value="(val: any) => onFieldUpdate(field.key, val)"
          :placeholder="field.placeholder"
          :maxlength="field.stringConfig?.maxlength"
          :show-limit-number="field.stringConfig?.showLimitNumber"
          :disabled="field.disabled"
        />
      </template>
      <span class="json-form-help" v-if="field.help">{{ field.help }}</span>
    </div>
  </template>

  <!-- number -->
  <template v-else-if="field.valueType === 'number'">
    <div class="json-form-field" :class="[field.className, field.span ? `col-span-${field.span}` : '']">
      <label class="json-form-label">{{ field.label }}</label>
      <template v-if="field.options?.length">
        <t-select
          :model-value="data[field.key] ?? 0"
          @update:model-value="(val: any) => onFieldUpdate(field.key, val)"
          :placeholder="field.placeholder"
          clearable class="w-full"
        >
          <t-option v-for="opt in field.options" :key="opt.value" :value="opt.value" :label="opt.label" />
        </t-select>
      </template>
      <template v-else>
        <t-input-number
          :model-value="data[field.key] ?? 0"
          @update:model-value="(val: any) => onFieldUpdate(field.key, val)"
          :placeholder="field.placeholder"
          :min="field.numberConfig?.min"
          :max="field.numberConfig?.max"
          :step="field.numberConfig?.step ?? 1"
          :decimal-places="field.numberConfig?.precision"
          class="w-full"
        />
      </template>
      <span class="json-form-help" v-if="field.help">{{ field.help }}</span>
    </div>
  </template>

  <!-- boolean -->
  <template v-else-if="field.valueType === 'boolean'">
    <div class="json-form-field" :class="[field.className, field.span ? `col-span-${field.span}` : '']">
      <div class="flex items-center gap-2">
        <t-switch
          :model-value="data[field.key] ?? false"
          @update:model-value="(val: any) => onFieldUpdate(field.key, val)"
          :disabled="field.disabled"
        />
        <label class="json-form-label !mb-0">{{ field.label }}</label>
      </div>
      <span class="json-form-help" v-if="field.help">{{ field.help }}</span>
    </div>
  </template>

  <!-- array -->
  <template v-else-if="field.valueType === 'array'">
    <div class="json-form-field json-form-array" :class="[field.className, field.span ? `col-span-${field.span}` : '']">
      <label class="json-form-label">{{ field.label }}</label>

      <!-- select/multiple-select -->
      <template v-if="field.arrayConfig?.displayType === 'select' || field.arrayConfig?.displayType === 'multiple-select'">
        <t-select
          :model-value="data[field.key] ?? []"
          @update:model-value="(val: any) => onFieldUpdate(field.key, val)"
          :placeholder="field.placeholder"
          :multiple="true" clearable class="w-full"
        >
          <t-option v-for="opt in field.arrayConfig?.item?.options || []" :key="opt.value" :value="opt.value" :label="opt.label" />
        </t-select>
      </template>

      <!-- checkbox -->
      <template v-else-if="field.arrayConfig?.displayType === 'checkbox'">
        <t-checkbox-group
          :model-value="data[field.key] ?? []"
          @update:model-value="(val: any) => onFieldUpdate(field.key, val)"
        >
          <t-checkbox v-for="opt in field.arrayConfig?.item?.options || []" :key="opt.value" :value="opt.value">{{ opt.label }}</t-checkbox>
        </t-checkbox-group>
      </template>

      <!-- tag-input -->
      <template v-else-if="field.arrayConfig?.displayType === 'tag-input'">
        <t-tag-input
          :model-value="data[field.key] ?? []"
          @update:model-value="(val: any) => onFieldUpdate(field.key, val)"
          :placeholder="field.placeholder"
          clearable class="w-full"
        />
      </template>

      <!-- tabs -->
      <template v-else-if="field.arrayConfig?.displayType === 'tabs'">
        <ArrayTabsMode
          :field="field"
          :items="data[field.key] ?? []"
          :data="data"
          :depth="depth"
          :active-tab="activeArrayTab"
          @update:active-tab="(val) => emit('updateActiveArrayTab', val)"
          @update="handleArrayUpdate"
          @tab-remove="handleArrayTabsRemove"
          @add-item="handleAddArrayItem"
          @open-add-field-dialog="(f, idx) => emit('openAddFieldDialog', f, idx, data, dataKey)"
          @change="emit('change')"
        />
      </template>

      <!-- default (tag-input for no arrayConfig) -->
      <template v-else-if="!field.arrayConfig">
        <t-tag-input
          :model-value="data[field.key] ?? []"
          @update:model-value="(val: any) => onFieldUpdate(field.key, val)"
          :placeholder="field.placeholder"
          clearable class="w-full"
        />
      </template>

      <!-- list -->
      <template v-else>
        <ArrayListMode
          :field="field"
          :items="data[field.key] ?? []"
          :data="data"
          :depth="depth"
          :collapsed-states="collapsedStates"
          @update="handleArrayUpdate"
          @open-add-field-dialog="(f, idx) => emit('openAddFieldDialog', f, idx, data, dataKey)"
          @toggle-collapse="(key, idx) => emit('toggleCollapse', key, idx)"
          @change="emit('change')"
        />
      </template>

      <span class="json-form-help" v-if="field.help">{{ field.help }}</span>
    </div>
  </template>

  <!-- object -->
  <template v-else-if="field.valueType === 'object'">
    <div class="json-form-field json-form-object" :class="[field.className, field.span ? `col-span-${field.span}` : '']">
      <div class="flex items-center justify-between mb-1">
        <label class="json-form-label mb-0">{{ field.label }}</label>
        <t-button variant="text" size="small" @click="objFieldDialogVisible = true">
          <t-icon name="add" /> 添加字段
        </t-button>
      </div>
      <div class="object-wrap">
        <component
          :is="JsonFormComp"
          :schema="{ fields: objectMergedFields }"
          :model-value="data[field.key] ?? {}"
          :depth="depth + 1"
          @update:model-value="onObjectUpdate"
        />
      </div>
      <span class="json-form-help" v-if="field.help">{{ field.help }}</span>
    </div>
  </template>

  <!-- 对象字段的添加字段弹窗 -->
  <AddFieldDialog
    :visible="objFieldDialogVisible"
    :field="field"
    :data="data[field.key] ?? {}"
    :item-index="0"
    :data-key="dataKey"
    mode="object"
    :object-templates="objectTemplates(field)"
    @update:visible="objFieldDialogVisible = $event"
    @confirm="onObjectAddFieldConfirm"
  />
</template>

<style scoped>
.json-form-field {
  margin-bottom: 16px;
}
.json-form-label {
  display: block;
  font-size: 13px;
  color: #4e5969;
  margin-bottom: 6px;
  font-weight: 500;
}
.json-form-help {
  display: block;
  font-size: 12px;
  color: #86909c;
  margin-top: 4px;
}
.object-wrap {
  margin-top: 4px;
  border: 1px solid #dfe1e6;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
}
</style>
