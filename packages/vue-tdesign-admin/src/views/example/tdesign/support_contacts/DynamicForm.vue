<script setup lang="ts">
import { computed, shallowRef, markRaw, type Component } from 'vue'
import type { FormInstanceFunctions } from 'tdesign-vue-next'
import FUploadCover from '@/views/example/tdesign/components/FUpload/FUploadCover2.vue'

export type FormFieldConfig = {
  key: string
  label: string
  required?: boolean
  defaultValue?: any
  // 内置快捷类型
  type?: 'input' | 'textarea' | 'select' | 'switch' | 'date-picker' | 'radio' | 'upload'
  // 内置类型的快捷 props
  maxlength?: number
  showLimitNumber?: boolean
  placeholder?: string
  options?: { label: string; value: any }[]
  // 通用自定义渲染：组件名或组件本身
  component?: string | Component
  // 传递给自定义组件的 props（modelValue 和 onUpdate:modelValue 会由组件自动处理）
  componentProps?: Record<string, any>
}

type Props = {
  fields: FormFieldConfig[]
  column?: number // 列数，默认 1
}

const props = withDefaults(defineProps<Props>(), {
  column: 1,
})

const model = defineModel<Record<string, any>>({
  default: () => ({}),
})

const formRef = shallowRef<FormInstanceFunctions>()

const getDefaultValue = (field: FormFieldConfig) => {
  if (field.defaultValue !== undefined) return field.defaultValue
  if (field.type === 'switch') return false
  if (field.type === 'select') return []
  return ''
}

// 初始化 model 中缺失的字段
const initField = (field: FormFieldConfig) => {
  if (!(field.key in model.value)) {
    model.value[field.key] = getDefaultValue(field)
  }
}

const defaultRules = (field: FormFieldConfig) =>
  field.required ? [{ required: true, message: `请输入${field.label}` }] : []

// 内置类型对应的组件映射
const builtInComponentMap: Record<string, any> = {
  input: 't-input',
  textarea: 't-textarea',
  select: 't-select',
  switch: 't-switch',
  'date-picker': 't-date-picker',
  radio: 't-radio-group',
  upload: markRaw(FUploadCover),
}

// 为内置类型生成默认 props
const builtInDefaultProps = (field: FormFieldConfig): Record<string, any> => {
  const props: Record<string, any> = {}
  if (field.maxlength !== undefined) props.maxlength = field.maxlength
  if (field.showLimitNumber !== undefined) props.showLimitNumber = field.showLimitNumber
  if (field.placeholder) {
    props.placeholder = field.placeholder
  } else if (field.type !== 'switch' && field.type !== 'upload') {
    props.placeholder = `请输入${field.label}`
  }
  if (field.type === 'select' && field.options) {
    props.options = field.options
  }
  return props
}

// 解析字段的组件和 props
const resolveFieldComponent = (field: FormFieldConfig) => {
  if (field.component) {
    return { comp: field.component, extraProps: field.componentProps || {} }
  }
  if (field.type && builtInComponentMap[field.type]) {
    return { comp: builtInComponentMap[field.type], extraProps: builtInDefaultProps(field) }
  }
  // 默认 fallback 为 t-input
  return { comp: 't-input', extraProps: { placeholder: `请输入${field.label}` } }
 }

defineExpose({
  async validate() {
    return formRef.value?.validate?.()
  },
  clearValidate() {
    formRef.value?.clearValidate?.()
  },
})
</script>

<template>
  <t-form ref="formRef" :data="model" class="w-full">
    <div
      class="dynamic-form-grid"
      :style="{
        display: 'grid',
        gridTemplateColumns: `repeat(${column}, 1fr)`,
        gap: '0 24px',
      }"
    >
      <template v-for="field in fields" :key="field.key">
        <t-form-item
          :label="field.label"
          :name="field.key"
          :rules="defaultRules(field)"
          :class="field.type === 'textarea' || field.type === 'switch' || field.type === 'radio' || field.type === 'upload' || (!field.type && field.component) ? 'col-span-full' : column > 1 ? '' : 'col-span-full'"
        >
          <component
            :is="resolveFieldComponent(field).comp"
            :model-value="model[field.key] ?? ''"
            @update:model-value="initField(field); model[field.key] = $event"
            v-bind="resolveFieldComponent(field).extraProps"
            :class="field.type === 'select' || field.type === 'date-picker' ? 'w-full' : ''"
          >
            <template v-if="field.type === 'radio'">
              <t-radio
                v-for="opt in field.options || []"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </t-radio>
            </template>
          </component>
        </t-form-item>
      </template>
    </div>
  </t-form>
</template>

<style scoped>
.dynamic-form-grid {
  width: 100%;
}
.col-span-full {
  grid-column: 1 / -1;
}
</style>
