<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FormFieldConfig, FormSchema, CustomComponentConfig } from './types'
import JsonForm from './JsonForm.vue'

type Props = {
  schema: FormSchema
  modelValue: Record<string, any>
  depth?: number
}

const props = withDefaults(defineProps<Props>(), {
  depth: 0,
})
const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>]
  change: [values: Record<string, any>]
}>()

const formData = computed(() => props.modelValue)
const hasGroups = computed(() => !!(props.schema.groups && props.schema.groups.length > 0))

const notifyChange = () => {
  const val = { ...formData.value }
  emit('update:modelValue', val)
  emit('change', val)
  props.schema.onChange?.(val)
}

const updateField = (key: string, val: any) => {
  const data = { ...formData.value, [key]: val }
  emit('update:modelValue', data)
  emit('change', data)
  props.schema.onChange?.(data)
}

const isFieldHidden = (field: FormFieldConfig): boolean => {
  if (typeof field.hidden === 'function') return field.hidden(formData.value)
  if (field.hidden) return true
  if (field.condition) {
    const depVal = formData.value[field.condition.field]
    if (field.condition.when) return !field.condition.when(depVal)
    return depVal !== field.condition.value
  }
  return false
}

const getDefaultValue = (field: FormFieldConfig): any => {
  if (field.defaultValue !== undefined) return field.defaultValue
  switch (field.valueType) {
    case 'string': return ''
    case 'number': return 0
    case 'boolean': return false
    case 'array': return []
    case 'object': return {}
    default: return ''
  }
}

const resolveCustomComponent = (config: CustomComponentConfig) => {
  return typeof config.component === 'string' ? config.component : config.component
}

// ====== 表单字段渲染（数组/对象等逻辑）======
const collapsedStates = ref<Record<string, Record<number, boolean>>>({})

const isCollapsed = (fieldKey: string, idx: number) => {
  return collapsedStates.value[fieldKey]?.[idx] ?? false
}

const toggleCollapse = (fieldKey: string, idx: number) => {
  if (!collapsedStates.value[fieldKey]) {
    collapsedStates.value[fieldKey] = {}
  }
  collapsedStates.value[fieldKey][idx] = !collapsedStates.value[fieldKey][idx]
}

const addArrayItem = (field: FormFieldConfig, data: Record<string, any>) => {
  const list = [...(data[field.key] || [])]
  const itemValueType = field.arrayConfig?.item?.valueType
  let newItem: any
  if (itemValueType === 'object') {
    newItem = {}
    field.arrayConfig?.item?.fields?.forEach((f) => {
      newItem[f.key] = getDefaultValue(f)
    })
  } else {
    newItem = ''
  }
  list.push(newItem)
  return { ...data, [field.key]: list }
}

const deleteArrayItem = (field: FormFieldConfig, idx: number, data: Record<string, any>) => {
  const list = [...(data[field.key] || [])]
  list.splice(idx, 1)
  return { ...data, [field.key]: list }
}

const moveArrayItem = (field: FormFieldConfig, idx: number, dir: 'up' | 'down', data: Record<string, any>) => {
  const list = [...(data[field.key] || [])]
  const targetIdx = dir === 'up' ? idx - 1 : idx + 1
  if (targetIdx < 0 || targetIdx >= list.length) return data
  const [removed] = list.splice(idx, 1)
  list.splice(targetIdx, 0, removed)
  return { ...data, [field.key]: list }
}

const updateArrayItem = (field: FormFieldConfig, idx: number, val: any, data: Record<string, any>) => {
  const list = [...(data[field.key] || [])]
  list[idx] = val
  return { ...data, [field.key]: list }
}

// 额外字段
const getExtraFields = (item: any): string[] => item?._extraFields ?? []

const addExtraField = (field: FormFieldConfig, idx: number, tmplKey: string, data: Record<string, any>) => {
  const item = { ...((data[field.key] || [])[idx] || {}) }
  const extraFields = [...(item._extraFields || [])]
  if (extraFields.includes(tmplKey)) return data
  extraFields.push(tmplKey)
  item._extraFields = extraFields
  const tmpl = field.arrayConfig?.item?.extraFieldTemplates?.find((t) => t.key === tmplKey)
  item[tmplKey] = tmpl?.defaultValue !== undefined ? tmpl.defaultValue : ''
  return updateArrayItem(field, idx, item, data)
}

const removeExtraField = (field: FormFieldConfig, idx: number, tmplKey: string, data: Record<string, any>) => {
  const item = { ...((data[field.key] || [])[idx] || {}) }
  const extraFields = [...(item._extraFields || [])].filter((k) => k !== tmplKey)
  item._extraFields = extraFields
  delete item[tmplKey]
  return updateArrayItem(field, idx, item, data)
}

const updateExtraField = (field: FormFieldConfig, idx: number, tmplKey: string, val: any, data: Record<string, any>) => {
  const item = { ...((data[field.key] || [])[idx] || {}) }
  item[tmplKey] = val
  return updateArrayItem(field, idx, item, data)
}

const extraFieldTemplates = (field: FormFieldConfig) => field.arrayConfig?.item?.extraFieldTemplates || []

// ====== 分组（groups）操作 ======
const activeGroupTab = ref('')

const addGroup = () => {
  // 找到一个未添加的分组模板，添加一个新实例
  const group = props.schema.groups?.[0]
  if (!group) return
  const key = group.key || group.label
  if (typeof key !== 'string') return
  const instanceKey = `${key}_${Date.now()}`
  const data = { ...formData.value, [instanceKey]: {} }
  // 记录分组实例的模板引用
  if (!data._groupInstances) data._groupInstances = []
  data._groupInstances = [...data._groupInstances, instanceKey]
  emit('update:modelValue', data)
  emit('change', data)
  props.schema.onChange?.(data)
  activeGroupTab.value = instanceKey
}

const removeGroup = (instanceKey: string) => {
  const data = { ...formData.value }
  delete data[instanceKey]
  if (data._groupInstances) {
    data._groupInstances = data._groupInstances.filter((k: string) => k !== instanceKey)
  }
  emit('update:modelValue', data)
  emit('change', data)
  props.schema.onChange?.(data)
}

// 添加字段弹窗
const addFieldVisible = ref(false)
const addFieldContext = ref<{ field: FormFieldConfig; itemIndex: number; data: Record<string, any>; dataKey: string }>({
  field: null as any,
  itemIndex: -1,
  data: {},
  dataKey: '',
})

const selectedTemplates = ref<string[]>([])
const customFieldNameInput = ref('')

const openAddFieldDialog = (field: FormFieldConfig, idx: number, data: Record<string, any>, dataKey: string) => {
  addFieldContext.value = { field, itemIndex: idx, data, dataKey }
  selectedTemplates.value = []
  customFieldNameInput.value = ''
  addFieldVisible.value = true
}

const closeAddFieldDialog = () => {
  addFieldVisible.value = false
  selectedTemplates.value = []
  customFieldNameInput.value = ''
}

const confirmAddFields = () => {
  const { field, itemIndex, data, dataKey } = addFieldContext.value
  if (!field) { closeAddFieldDialog(); return }
  let newData = data
  selectedTemplates.value.forEach((key) => {
    newData = addExtraField(field, itemIndex, key, newData)
  })
  const customName = customFieldNameInput.value.trim()
  if (customName) {
    const item = { ...((newData[field.key] || [])[itemIndex] || {}) }
    const extraFields = [...(item._extraFields || [])]
    if (!extraFields.includes(customName)) {
      extraFields.push(customName)
      item._extraFields = extraFields
      item[customName] = ''
      newData = updateArrayItem(field, itemIndex, item, newData)
    }
  }
  updateField(dataKey, newData)
  closeAddFieldDialog()
}

const addCustomFieldOnly = () => {
  const { field, itemIndex, data, dataKey } = addFieldContext.value
  if (!field) return
  const customName = customFieldNameInput.value.trim()
  if (!customName) return
  let newData = data
  const item = { ...((newData[field.key] || [])[itemIndex] || {}) }
  const extraFields = [...(item._extraFields || [])]
  if (!extraFields.includes(customName)) {
    extraFields.push(customName)
    item._extraFields = extraFields
    item[customName] = ''
    newData = updateArrayItem(field, itemIndex, item, newData)
  }
  customFieldNameInput.value = ''
  updateField(dataKey, newData)
}
</script>

<template>
  <div class="json-form" :style="{ marginLeft: depth > 0 ? '12px' : '0' }">
    <!-- ====== 有 groups：以可动态添加的 tabs 展示 ====== -->
    <template v-if="hasGroups">
      <div class="groups-header flex items-center gap-2 mb-3">
        <t-button variant="outline" size="small" @click="addGroup">
          + 添加分组
        </t-button>
      </div>
      <t-tabs
        v-if="formData._groupInstances?.length"
        v-model="activeGroupTab"
        placement="top"
        size="medium"
        :addable="false"
      >
        <t-tab-panel
          v-for="instanceKey in formData._groupInstances"
          :key="instanceKey"
          :value="instanceKey"
          :label="instanceKey"
          :removable="true"
          @remove="removeGroup(instanceKey)"
        >
          <div class="pt-3">
            <div
              v-for="(field, fi) in props.schema.groups?.[0]?.fields || []"
              :key="`${instanceKey}-${fi}`"
            >
              <!-- ====== 自定义组件 ====== -->
              <template v-if="field.component">
                <div class="json-form-field" :class="[field.className, field.span ? `col-span-${field.span}` : '']">
                  <label class="json-form-label" v-if="field.label">{{ field.label }}</label>
                  <component
                    :is="resolveCustomComponent(field.component)"
                    :model-value="formData[instanceKey]?.[field.key] ?? getDefaultValue(field)"
                    @update:model-value="(val: any) => updateField(instanceKey, { ...(formData[instanceKey] || {}), [field.key]: val })"
                    v-bind="field.component.props || {}"
                  />
                  <span class="json-form-help" v-if="field.help">{{ field.help }}</span>
                </div>
              </template>

              <!-- ====== string ====== -->
              <template v-else-if="field.valueType === 'string'">
                <div class="json-form-field" :class="[field.className, field.span ? `col-span-${field.span}` : '']">
                  <label class="json-form-label">{{ field.label }}</label>
                  <template v-if="field.options?.length">
                    <t-select
                      :model-value="formData[instanceKey]?.[field.key] ?? ''"
                      @update:model-value="(val: any) => updateField(instanceKey, { ...(formData[instanceKey] || {}), [field.key]: val })"
                      :placeholder="field.placeholder"
                      :multiple="field.multiple"
                      clearable class="w-full"
                    >
                      <t-option v-for="opt in field.options" :key="opt.value" :value="opt.value" :label="opt.label" />
                    </t-select>
                  </template>
                  <template v-else-if="field.stringConfig?.textarea">
                    <t-textarea
                      :model-value="formData[instanceKey]?.[field.key] ?? ''"
                      @update:model-value="(val: any) => updateField(instanceKey, { ...(formData[instanceKey] || {}), [field.key]: val })"
                      :placeholder="field.placeholder"
                      :maxlength="field.stringConfig?.maxlength"
                      :show-limit-number="field.stringConfig?.showLimitNumber"
                      :rows="field.stringConfig?.rows || 3"
                    />
                  </template>
                  <template v-else>
                    <t-input
                      :model-value="formData[instanceKey]?.[field.key] ?? ''"
                      @update:model-value="(val: any) => updateField(instanceKey, { ...(formData[instanceKey] || {}), [field.key]: val })"
                      :placeholder="field.placeholder"
                      :maxlength="field.stringConfig?.maxlength"
                      :show-limit-number="field.stringConfig?.showLimitNumber"
                    />
                  </template>
                </div>
              </template>

              <!-- ====== number ====== -->
              <template v-else-if="field.valueType === 'number'">
                <div class="json-form-field" :class="[field.className, field.span ? `col-span-${field.span}` : '']">
                  <label class="json-form-label">{{ field.label }}</label>
                  <template v-if="field.options?.length">
                    <t-select
                      :model-value="formData[instanceKey]?.[field.key] ?? ''"
                      @update:model-value="(val: any) => updateField(instanceKey, { ...(formData[instanceKey] || {}), [field.key]: val })"
                      :placeholder="field.placeholder"
                      clearable class="w-full"
                    >
                      <t-option v-for="opt in field.options" :key="opt.value" :value="opt.value" :label="opt.label" />
                    </t-select>
                  </template>
                  <template v-else>
                    <t-input-number
                      :model-value="formData[instanceKey]?.[field.key] ?? 0"
                      @update:model-value="(val: any) => updateField(instanceKey, { ...(formData[instanceKey] || {}), [field.key]: val })"
                      :placeholder="field.placeholder"
                      :min="field.numberConfig?.min"
                      :max="field.numberConfig?.max"
                      :step="field.numberConfig?.step ?? 1"
                      :decimal-places="field.numberConfig?.precision"
                      class="w-full"
                    />
                  </template>
                </div>
              </template>

              <!-- ====== boolean ====== -->
              <template v-else-if="field.valueType === 'boolean'">
                <div class="json-form-field" :class="[field.className, field.span ? `col-span-${field.span}` : '']">
                  <div class="flex items-center gap-2">
                    <t-switch
                      :model-value="formData[instanceKey]?.[field.key] ?? false"
                      @update:model-value="(val: any) => updateField(instanceKey, { ...(formData[instanceKey] || {}), [field.key]: val })"
                    />
                    <label class="json-form-label !mb-0">{{ field.label }}</label>
                  </div>
                </div>
              </template>

              <!-- ====== array ====== -->
              <template v-else-if="field.valueType === 'array'">
                <div class="json-form-field json-form-array" :class="[field.className, field.span ? `col-span-${field.span}` : '']">
                  <label class="json-form-label">{{ field.label }}</label>
                  <template v-if="field.arrayConfig?.displayType === 'select' || field.arrayConfig?.displayType === 'multiple-select'">
                    <t-select
                      :model-value="formData[instanceKey]?.[field.key] ?? []"
                      @update:model-value="(val: any) => updateField(instanceKey, { ...(formData[instanceKey] || {}), [field.key]: val })"
                      :placeholder="field.placeholder"
                      :multiple="true" clearable class="w-full"
                    >
                      <t-option v-for="opt in field.arrayConfig?.item?.options || []" :key="opt.value" :value="opt.value" :label="opt.label" />
                    </t-select>
                  </template>
                  <template v-else-if="field.arrayConfig?.displayType === 'checkbox'">
                    <t-checkbox-group
                      :model-value="formData[instanceKey]?.[field.key] ?? []"
                      @update:model-value="(val: any) => updateField(instanceKey, { ...(formData[instanceKey] || {}), [field.key]: val })"
                    >
                      <t-checkbox v-for="opt in field.arrayConfig?.item?.options || []" :key="opt.value" :value="opt.value">{{ opt.label }}</t-checkbox>
                    </t-checkbox-group>
                  </template>
                  <template v-else-if="field.arrayConfig?.displayType === 'tag-input'">
                    <t-tag-input
                      :model-value="formData[instanceKey]?.[field.key] ?? []"
                      @update:model-value="(val: any) => updateField(instanceKey, { ...(formData[instanceKey] || {}), [field.key]: val })"
                      :placeholder="field.placeholder" clearable class="w-full"
                    />
                  </template>
                  <!-- list 模式 -->
                  <template v-else>
                    <div class="array-list-wrap">
                      <div
                        v-for="(item, idx) in (formData[instanceKey]?.[field.key] ?? [])"
                        :key="`${instanceKey}-${field.key}-${idx}`"
                        class="array-list-item"
                      >
                        <div class="array-list-item-header">
                          <div class="flex items-center gap-1">
                            <t-button variant="text" size="small" @click="toggleCollapse(field.key, idx)">
                              <t-icon :name="isCollapsed(field.key, idx) ? 'chevron-right' : 'chevron-down'" />
                            </t-button>
                            <span class="text-xs font-medium">{{ field.label }} #{{ idx + 1 }}</span>
                          </div>
                          <div class="flex items-center gap-1">
                            <t-button variant="text" size="small" @click="openAddFieldDialog(field, idx, formData[instanceKey], instanceKey)">
                              <t-icon name="add" />
                            </t-button>
                            <t-button variant="text" size="small" @click="updateField(instanceKey, moveArrayItem(field, idx, 'up', formData[instanceKey] || {}))" :disabled="idx === 0">
                              <t-icon name="chevron-up" />
                            </t-button>
                            <t-button variant="text" size="small" @click="updateField(instanceKey, moveArrayItem(field, idx, 'down', formData[instanceKey] || {}))" :disabled="idx === (formData[instanceKey]?.[field.key] ?? []).length - 1">
                              <t-icon name="chevron-down" />
                            </t-button>
                            <t-button variant="text" size="small" @click="updateField(instanceKey, deleteArrayItem(field, idx, formData[instanceKey] || {}))">
                              <t-icon name="delete" class="text-red-500" />
                            </t-button>
                          </div>
                        </div>
                        <div class="array-list-item-body" v-show="!isCollapsed(field.key, idx)">
                          <template v-if="field.arrayConfig?.item?.valueType === 'object'">
                            <JsonForm
                              :schema="{ fields: field.arrayConfig.item.fields || [] }"
                              :model-value="item"
                              :depth="depth + 1"
                              @update:model-value="(val: Record<string, any>) => updateField(instanceKey, updateArrayItem(field, idx, val, formData[instanceKey] || {}))"
                              @change="notifyChange"
                            />
                            <template v-if="extraFieldTemplates(field).length">
                              <div class="extra-fields-divider" v-if="getExtraFields(item).length">额外字段</div>
                              <div v-for="tmpl in extraFieldTemplates(field)" :key="tmpl.key" v-show="getExtraFields(item).includes(tmpl.key)" class="extra-field-item">
                                <div class="flex items-start gap-2">
                                  <div class="flex-1">
                                    <template v-if="tmpl.valueType === 'string'">
                                      <label class="json-form-label">{{ tmpl.label }}</label>
                                      <template v-if="tmpl.options?.length">
                                        <t-select :model-value="item[tmpl.key] ?? ''" @update:model-value="(val: any) => updateField(instanceKey, updateExtraField(field, idx, tmpl.key, val, formData[instanceKey] || {}))" clearable class="w-full">
                                          <t-option v-for="opt in tmpl.options" :key="opt.value" :value="opt.value" :label="opt.label" />
                                        </t-select>
                                      </template>
                                      <template v-else-if="tmpl.stringConfig?.textarea">
                                        <t-textarea :model-value="item[tmpl.key] ?? ''" @update:model-value="(val: any) => updateField(instanceKey, updateExtraField(field, idx, tmpl.key, val, formData[instanceKey] || {}))" :placeholder="tmpl.placeholder" :rows="tmpl.stringConfig?.rows || 2" />
                                      </template>
                                      <template v-else>
                                        <t-input :model-value="item[tmpl.key] ?? ''" @update:model-value="(val: any) => updateField(instanceKey, updateExtraField(field, idx, tmpl.key, val, formData[instanceKey] || {}))" :placeholder="tmpl.placeholder" />
                                      </template>
                                    </template>
                                    <template v-else-if="tmpl.valueType === 'number'">
                                      <label class="json-form-label">{{ tmpl.label }}</label>
                                      <t-input-number :model-value="item[tmpl.key] ?? 0" @update:model-value="(val: any) => updateField(instanceKey, updateExtraField(field, idx, tmpl.key, val, formData[instanceKey] || {}))" :step="tmpl.numberConfig?.step ?? 1" class="w-full" />
                                    </template>
                                    <template v-else-if="tmpl.valueType === 'boolean'">
                                      <div class="flex items-center gap-2 mt-2">
                                        <t-switch :model-value="item[tmpl.key] ?? false" @update:model-value="(val: any) => updateField(instanceKey, updateExtraField(field, idx, tmpl.key, val, formData[instanceKey] || {}))" />
                                        <label class="json-form-label !mb-0">{{ tmpl.label }}</label>
                                      </div>
                                    </template>
                                  </div>
                                  <t-button variant="text" size="small" class="mt-5" @click="updateField(instanceKey, removeExtraField(field, idx, tmpl.key, formData[instanceKey] || {}))">
                                    <t-icon name="delete" class="text-red-500" />
                                  </t-button>
                                </div>
                              </div>
                            </template>
                          </template>
                          <template v-else-if="field.arrayConfig?.item?.options?.length">
                            <t-select :model-value="item" @update:model-value="(val: any) => updateField(instanceKey, updateArrayItem(field, idx, val, formData[instanceKey] || {}))" clearable class="w-full">
                              <t-option v-for="opt in field.arrayConfig!.item!.options!" :key="opt.value" :value="opt.value" :label="opt.label" />
                            </t-select>
                          </template>
                          <template v-else>
                            <t-input :model-value="item" @update:model-value="(val: any) => updateField(instanceKey, updateArrayItem(field, idx, val, formData[instanceKey] || {}))" :placeholder="field.placeholder || `请输入第 ${idx + 1} 项`" />
                          </template>
                        </div>
                      </div>
                      <t-button variant="outline" size="small" class="mt-2" @click="updateField(instanceKey, addArrayItem(field, formData[instanceKey] || {}))">+ 添加{{ field.label }}</t-button>
                    </div>
                  </template>
                </div>
              </template>

              <!-- ====== object ====== -->
              <template v-else-if="field.valueType === 'object'">
                <div class="json-form-field json-form-object" :class="[field.className, field.span ? `col-span-${field.span}` : '']">
                  <label class="json-form-label">{{ field.label }}</label>
                  <div class="object-wrap border border-solid border-[#dfe1e6] rounded-lg p-4 bg-[#fafafa]">
                    <JsonForm
                      :schema="{ fields: field.objectConfig?.fields || [] }"
                      :model-value="formData[instanceKey]?.[field.key] ?? {}"
                      :depth="depth + 1"
                      @update:model-value="(val: Record<string, any>) => updateField(instanceKey, { ...(formData[instanceKey] || {}), [field.key]: val })"
                      @change="notifyChange"
                    />
                  </div>
                </div>
              </template>
            </div>
          </div>
        </t-tab-panel>
      </t-tabs>
    </template>

    <!-- ====== 无 groups：平面字段渲染 ====== -->
    <template v-else>
      <template v-for="field in schema.fields" :key="field.key">
        <template v-if="isFieldHidden(field)"></template>

        <!-- ====== 自定义组件 ====== -->
        <template v-else-if="field.component">
          <div class="json-form-field" :class="[field.className, field.span ? `col-span-${field.span}` : '']">
            <label class="json-form-label" v-if="field.label">{{ field.label }}</label>
            <component
              :is="resolveCustomComponent(field.component)"
              :model-value="formData[field.key] ?? getDefaultValue(field)"
              @update:model-value="(val: any) => updateField(field.key, val)"
              v-bind="field.component.props || {}"
            />
            <span class="json-form-help" v-if="field.help">{{ field.help }}</span>
          </div>
        </template>

        <!-- ====== string ====== -->
        <template v-else-if="field.valueType === 'string'">
          <div class="json-form-field" :class="[field.className, field.span ? `col-span-${field.span}` : '']">
            <label class="json-form-label">{{ field.label }}</label>
            <template v-if="field.options?.length">
              <t-select :model-value="formData[field.key] ?? ''" @update:model-value="(val: any) => updateField(field.key, val)" :placeholder="field.placeholder || `请选择${field.label}`" :multiple="field.multiple" clearable class="w-full">
                <t-option v-for="opt in field.options" :key="opt.value" :value="opt.value" :label="opt.label" :disabled="opt.disabled" />
              </t-select>
            </template>
            <template v-else-if="field.stringConfig?.textarea">
              <t-textarea :model-value="formData[field.key] ?? ''" @update:model-value="(val: any) => updateField(field.key, val)" :placeholder="field.placeholder || `请输入${field.label}`" :maxlength="field.stringConfig?.maxlength" :show-limit-number="field.stringConfig?.showLimitNumber" :rows="field.stringConfig?.rows || 3" />
            </template>
            <template v-else>
              <t-input :model-value="formData[field.key] ?? ''" @update:model-value="(val: any) => updateField(field.key, val)" :placeholder="field.placeholder || `请输入${field.label}`" :maxlength="field.stringConfig?.maxlength" :show-limit-number="field.stringConfig?.showLimitNumber" :disabled="field.disabled" />
            </template>
            <span class="json-form-help" v-if="field.help">{{ field.help }}</span>
          </div>
        </template>

        <!-- ====== number ====== -->
        <template v-else-if="field.valueType === 'number'">
          <div class="json-form-field" :class="[field.className, field.span ? `col-span-${field.span}` : '']">
            <label class="json-form-label">{{ field.label }}</label>
            <template v-if="field.options?.length">
              <t-select :model-value="formData[field.key] ?? 0" @update:model-value="(val: any) => updateField(field.key, val)" :placeholder="field.placeholder || `请选择${field.label}`" clearable class="w-full">
                <t-option v-for="opt in field.options" :key="opt.value" :value="opt.value" :label="opt.label" :disabled="opt.disabled" />
              </t-select>
            </template>
            <template v-else>
              <t-input-number :model-value="formData[field.key] ?? 0" @update:model-value="(val: any) => updateField(field.key, val)" :placeholder="field.placeholder || `请输入${field.label}`" :min="field.numberConfig?.min" :max="field.numberConfig?.max" :step="field.numberConfig?.step ?? 1" :decimal-places="field.numberConfig?.precision" class="w-full" />
            </template>
            <span class="json-form-help" v-if="field.help">{{ field.help }}</span>
          </div>
        </template>

        <!-- ====== boolean ====== -->
        <template v-else-if="field.valueType === 'boolean'">
          <div class="json-form-field" :class="[field.className, field.span ? `col-span-${field.span}` : '']">
            <div class="flex items-center gap-2">
              <t-switch :model-value="formData[field.key] ?? false" @update:model-value="(val: any) => updateField(field.key, val)" :disabled="field.disabled" />
              <label class="json-form-label !mb-0">{{ field.label }}</label>
            </div>
            <span class="json-form-help" v-if="field.help">{{ field.help }}</span>
          </div>
        </template>

        <!-- ====== array ====== -->
        <template v-else-if="field.valueType === 'array'">
          <div class="json-form-field json-form-array" :class="[field.className, field.span ? `col-span-${field.span}` : '']">
            <label class="json-form-label">{{ field.label }}</label>
            <template v-if="field.arrayConfig?.displayType === 'select' || field.arrayConfig?.displayType === 'multiple-select'">
              <t-select :model-value="formData[field.key] ?? []" @update:model-value="(val: any) => updateField(field.key, val)" :placeholder="field.placeholder || `请选择${field.label}`" :multiple="true" clearable class="w-full">
                <t-option v-for="opt in field.arrayConfig?.item?.options || []" :key="opt.value" :value="opt.value" :label="opt.label" />
              </t-select>
            </template>
            <template v-else-if="field.arrayConfig?.displayType === 'checkbox'">
              <t-checkbox-group :model-value="formData[field.key] ?? []" @update:model-value="(val: any) => updateField(field.key, val)">
                <t-checkbox v-for="opt in field.arrayConfig?.item?.options || []" :key="opt.value" :value="opt.value">{{ opt.label }}</t-checkbox>
              </t-checkbox-group>
            </template>
            <template v-else-if="field.arrayConfig?.displayType === 'tag-input'">
              <t-tag-input :model-value="formData[field.key] ?? []" @update:model-value="(val: any) => updateField(field.key, val)" :placeholder="field.placeholder || `请输入${field.label}`" clearable class="w-full" />
            </template>
            <template v-else>
              <div class="array-list-wrap">
                <div v-for="(item, idx) in (formData[field.key] ?? [])" :key="`${field.key}-${idx}`" class="array-list-item">
                  <div class="array-list-item-header">
                    <div class="flex items-center gap-1">
                      <t-button variant="text" size="small" @click="toggleCollapse(field.key, idx)">
                        <t-icon :name="isCollapsed(field.key, idx) ? 'chevron-right' : 'chevron-down'" />
                      </t-button>
                      <span class="text-xs font-medium">{{ field.label }} #{{ idx + 1 }}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <t-button variant="text" size="small" @click="openAddFieldDialog(field, idx, formData, field.key)">
                        <t-icon name="add" />
                      </t-button>
                      <t-button variant="text" size="small" @click="updateField(field.key, moveArrayItem(field, idx, 'up', formData))" :disabled="idx === 0">
                        <t-icon name="chevron-up" />
                      </t-button>
                      <t-button variant="text" size="small" @click="updateField(field.key, moveArrayItem(field, idx, 'down', formData))" :disabled="idx === (formData[field.key] ?? []).length - 1">
                        <t-icon name="chevron-down" />
                      </t-button>
                      <t-button variant="text" size="small" @click="updateField(field.key, deleteArrayItem(field, idx, formData))">
                        <t-icon name="delete" class="text-red-500" />
                      </t-button>
                    </div>
                  </div>
                  <div class="array-list-item-body" v-show="!isCollapsed(field.key, idx)">
                    <template v-if="field.arrayConfig?.item?.valueType === 'object'">
                      <JsonForm :schema="{ fields: field.arrayConfig.item.fields || [] }" :model-value="item" :depth="depth + 1" @update:model-value="(val: Record<string, any>) => updateField(field.key, updateArrayItem(field, idx, val, formData))" @change="notifyChange" />
                      <template v-if="extraFieldTemplates(field).length">
                        <div class="extra-fields-divider" v-if="getExtraFields(item).length">额外字段</div>
                        <div v-for="tmpl in extraFieldTemplates(field)" :key="tmpl.key" v-show="getExtraFields(item).includes(tmpl.key)" class="extra-field-item">
                          <div class="flex items-start gap-2">
                            <div class="flex-1">
                              <template v-if="tmpl.valueType === 'string'">
                                <template v-if="tmpl.options?.length">
                                  <label class="json-form-label">{{ tmpl.label }}</label>
                                  <t-select :model-value="item[tmpl.key] ?? ''" @update:model-value="(val: any) => updateField(field.key, updateExtraField(field, idx, tmpl.key, val, formData))" clearable class="w-full">
                                    <t-option v-for="opt in tmpl.options" :key="opt.value" :value="opt.value" :label="opt.label" />
                                  </t-select>
                                </template>
                                <template v-else-if="tmpl.stringConfig?.textarea">
                                  <label class="json-form-label">{{ tmpl.label }}</label>
                                  <t-textarea :model-value="item[tmpl.key] ?? ''" @update:model-value="(val: any) => updateField(field.key, updateExtraField(field, idx, tmpl.key, val, formData))" :placeholder="tmpl.placeholder" :rows="tmpl.stringConfig?.rows || 2" />
                                </template>
                                <template v-else>
                                  <label class="json-form-label">{{ tmpl.label }}</label>
                                  <t-input :model-value="item[tmpl.key] ?? ''" @update:model-value="(val: any) => updateField(field.key, updateExtraField(field, idx, tmpl.key, val, formData))" :placeholder="tmpl.placeholder" />
                                </template>
                              </template>
                              <template v-else-if="tmpl.valueType === 'number'">
                                <label class="json-form-label">{{ tmpl.label }}</label>
                                <t-input-number :model-value="item[tmpl.key] ?? 0" @update:model-value="(val: any) => updateField(field.key, updateExtraField(field, idx, tmpl.key, val, formData))" :step="tmpl.numberConfig?.step ?? 1" class="w-full" />
                              </template>
                              <template v-else-if="tmpl.valueType === 'boolean'">
                                <div class="flex items-center gap-2 mt-2">
                                  <t-switch :model-value="item[tmpl.key] ?? false" @update:model-value="(val: any) => updateField(field.key, updateExtraField(field, idx, tmpl.key, val, formData))" />
                                  <label class="json-form-label !mb-0">{{ tmpl.label }}</label>
                                </div>
                              </template>
                            </div>
                            <t-button variant="text" size="small" class="mt-5" @click="updateField(field.key, removeExtraField(field, idx, tmpl.key, formData))">
                              <t-icon name="delete" class="text-red-500" />
                            </t-button>
                          </div>
                        </div>
                      </template>
                    </template>
                    <template v-else-if="field.arrayConfig?.item?.options?.length">
                      <t-select :model-value="item" @update:model-value="(val: any) => updateArrayItem(field, idx, val, formData)" clearable class="w-full">
                        <t-option v-for="opt in field.arrayConfig!.item!.options!" :key="opt.value" :value="opt.value" :label="opt.label" />
                      </t-select>
                    </template>
                    <template v-else>
                      <t-input :model-value="item" @update:model-value="(val: any) => updateArrayItem(field, idx, val, formData)" :placeholder="field.placeholder || `请输入第 ${idx + 1} 项`" />
                    </template>
                  </div>
                </div>
                <t-button variant="outline" size="small" class="mt-2" @click="addArrayItem(field, formData)">+ 添加{{ field.label }}</t-button>
              </div>
            </template>
            <span class="json-form-help" v-if="field.help">{{ field.help }}</span>
          </div>
        </template>

        <!-- ====== object ====== -->
        <template v-else-if="field.valueType === 'object'">
          <div class="json-form-field json-form-object" :class="[field.className, field.span ? `col-span-${field.span}` : '']">
            <label class="json-form-label">{{ field.label }}</label>
            <div class="object-wrap border border-solid border-[#dfe1e6] rounded-lg p-4 bg-[#fafafa]">
              <JsonForm :schema="{ fields: field.objectConfig?.fields || [] }" :model-value="formData[field.key] ?? {}" :depth="depth + 1" @update:model-value="(val: Record<string, any>) => updateField(field.key, val)" @change="notifyChange" />
            </div>
            <span class="json-form-help" v-if="field.help">{{ field.help }}</span>
          </div>
        </template>
      </template>
    </template>
  </div>

  <!-- ====== 添加字段弹窗 ====== -->
  <t-dialog
    v-model:visible="addFieldVisible"
    header="添加字段"
    :on-confirm="confirmAddFields"
    :on-close="closeAddFieldDialog"
    width="480"
  >
    <template v-if="addFieldContext.field">
      <div v-if="extraFieldTemplates(addFieldContext.field).length" class="mb-4">
        <label class="add-field-section-label">预定义字段</label>
        <t-checkbox-group v-model="selectedTemplates" class="flex flex-col gap-2">
          <t-checkbox
            v-for="tmpl in extraFieldTemplates(addFieldContext.field)"
            :key="tmpl.key"
            :value="tmpl.key"
            :disabled="getExtraFields(addFieldContext.data[addFieldContext.field.key]?.[addFieldContext.itemIndex]).includes(tmpl.key)"
          >
            {{ tmpl.label }}
            <span class="text-[#86909c] text-xs ml-1">({{ tmpl.valueType }})</span>
          </t-checkbox>
        </t-checkbox-group>
      </div>
      <div>
        <label class="add-field-section-label">自定义字段</label>
        <t-input
          :model-value="customFieldNameInput"
          @update:model-value="customFieldNameInput = $event"
          placeholder="输入字段名，按回车添加"
          clearable
          @enter="addCustomFieldOnly"
        />
      </div>
    </template>
  </t-dialog>
</template>

<style scoped>
.json-form {
  width: 100%;
}
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
.object-wrap {
  margin-top: 4px;
}
.extra-fields-divider {
  font-size: 12px;
  color: #86909c;
  margin: 12px 0 8px;
  padding-top: 8px;
  border-top: 1px dashed #e8e8e8;
  font-weight: 500;
}
.extra-field-item {
  padding: 6px 0;
}
.extra-field-item + .extra-field-item {
  border-top: 1px dashed #f0f0f0;
}
.add-field-section-label {
  display: block;
  font-size: 13px;
  color: #4e5969;
  margin-bottom: 8px;
  font-weight: 500;
}
</style>
