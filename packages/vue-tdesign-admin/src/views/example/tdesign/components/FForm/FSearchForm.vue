<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { FormInstanceFunctions } from 'tdesign-vue-next'
import { Input as TInput, Select as TSelect, DateRangePicker as TDateRangePicker, DatePicker as TDatePicker, InputNumber as TInputNumber } from 'tdesign-vue-next'

export interface FormField {
  name: string
  label?: string
  type?: 'input' | 'select' | 'date-range' | 'date-picker' | 'number'
  placeholder?: string
  options?: Array<{ label: string; value: any }>
  showLabel?: boolean
  labelInPlaceholder?: boolean
  span?: number
  props?: Record<string, any>
}

export interface Props {
  fields: FormField[]
  cols?: number
  expandable?: boolean
  defaultExpanded?: boolean
  showSearchBtn?: boolean
  showResetBtn?: boolean
  searchBtnText?: string
  resetBtnText?: string
  modelValue?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  cols: 3,
  expandable: true,
  defaultExpanded: false,
  showSearchBtn: true,
  showResetBtn: true,
  searchBtnText: '查询',
  resetBtnText: '重置',
  modelValue: () => ({})
})

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>]
  search: [value: Record<string, any>]
  reset: []
}>()

const formRef = ref<FormInstanceFunctions>()
const formData = ref<Record<string, any>>({ ...props.modelValue })
const expanded = ref(props.defaultExpanded)

const displayedFields = computed(() => {
  if (!props.expandable || expanded.value) {
    return props.fields
  }
  const firstRowFields = props.fields.slice(0, props.cols)
  return firstRowFields
})

const showExpandBtn = computed(() => {
  return props.expandable && props.fields.length > props.cols
})

const fieldSpan = computed(() => {
  return 24 / props.cols
})

const componentMap: Record<string, any> = {
  input: TInput,
  select: TSelect,
  'date-range': TDateRangePicker,
  'date-picker': TDatePicker,
  number: TInputNumber
}

const getComponent = (field: FormField) => {
  return componentMap[field.type || 'input'] || TInput
}

const getPlaceholder = (field: FormField) => {
  if (field.placeholder) {
    return field.placeholder
  }
  if (field.labelInPlaceholder && field.label) {
    return `请输入${field.label}`
  }
  return '请输入'
}

const getPlaceholderForNoLabel = (field: FormField) => {
  if (field.placeholder) {
    return field.placeholder
  }
  if (field.label) {
    const actionMap: Record<string, string> = {
      input: '请输入',
      select: '请选择',
      'date-range': '',
      'date-picker': '请选择',
      number: '请输入'
    }
    const action = actionMap[field.type || 'input']
    return action ? `${action}${field.label}` : field.label
  }
  return '请输入'
}

const getDateRangePlaceholder = (field: FormField) => {
  if (field.placeholder) {
    return [field.placeholder, field.placeholder]
  }
  if (field.label) {
    return [`开始${field.label}`, `结束${field.label}`]
  }
  return ['开始时间', '结束时间']
}

const handleSearch = () => {
  formRef.value?.validate().then((result) => {
    if (result === true) {
      emit('update:modelValue', { ...formData.value })
      emit('search', { ...formData.value })
    }
  })
}

const handleReset = () => {
  formRef.value?.reset()
  Object.keys(formData.value).forEach(key => {
    formData.value[key] = undefined
  })
  emit('update:modelValue', { ...formData.value })
  emit('reset')
}

const toggleExpand = () => {
  expanded.value = !expanded.value
}

watch(() => props.modelValue, (newVal) => {
  formData.value = { ...newVal }
}, { deep: true })
</script>

<template>
  <div class="f-search-form">
    <t-form
      ref="formRef"
      :data="formData"
      :colon="true"
      label-align="right"
      class="search-form"
    >
      <t-row :gutter="16">
        <t-col
          v-for="field in displayedFields"
          :key="field.name"
          :span="field.span || fieldSpan"
        >
          <t-form-item
            v-if="field.showLabel !== false"
            :name="field.name"
            :label="field.label"
          >
            <component
              :is="getComponent(field)"
              v-model="formData[field.name]"
              :placeholder="field.type === 'date-range' ? getDateRangePlaceholder(field) : getPlaceholder(field)"
              clearable
              v-bind="field.props"
            >
              <template v-if="field.type === 'select'">
                <t-option
                  v-for="option in field.options"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </template>
            </component>
          </t-form-item>
          <div v-else class="no-label-field">
            <component
              :is="getComponent(field)"
              v-model="formData[field.name]"
              :placeholder="field.type === 'date-range' ? getDateRangePlaceholder(field) : getPlaceholderForNoLabel(field)"
              clearable
              v-bind="field.props"
            >
              <template v-if="field.type === 'select'">
                <t-option
                  v-for="option in field.options"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </template>
            </component>
          </div>
        </t-col>
        <t-col :span="fieldSpan" class="action-col">
          <div class="action-buttons">
            <t-button
              v-if="showSearchBtn"
              theme="primary"
              @click="handleSearch"
            >
              {{ searchBtnText }}
            </t-button>
            <t-button
              v-if="showResetBtn"
              theme="default"
              @click="handleReset"
            >
              {{ resetBtnText }}
            </t-button>
            <t-button
              v-if="showExpandBtn"
              theme="default"
              variant="text"
              @click="toggleExpand"
            >
              {{ expanded ? '收起' : '展开' }}
              <template #icon>
                <t-icon
                  :name="expanded ? 'chevron-up' : 'chevron-down'"
                />
              </template>
            </t-button>
          </div>
        </t-col>
      </t-row>
    </t-form>
  </div>
</template>

<style scoped>
.f-search-form {
  width: 100%;
}

.search-form {
  width: 100%;
}

.no-label-field {
  width: 100%;
}

.action-col {
  display: flex;
  align-items: flex-start;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  padding-top: 4px;
}
</style>
