<script setup lang="ts">
import { shallowRef } from 'vue'
import type { FormInstanceFunctions } from 'tdesign-vue-next'
import FUploadCover from '@/views/example/tdesign/components/FUpload/FUploadCover2.vue'

export type FormFieldConfig = {
  key: string
  label: string
  type: 'input' | 'textarea' | 'select' | 'switch' | 'date-picker' | 'radio' | 'upload'
  required?: boolean
  maxlength?: number
  showLimitNumber?: boolean
  placeholder?: string
  defaultValue?: any
  options?: { label: string; value: any }[]
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
          v-if="field.type === 'input'"
          :label="field.label"
          :name="field.key"
          :rules="field.required ? [{ required: true, message: `请输入${field.label}` }] : []"
          :class="column > 1 ? '' : 'col-span-full'"
        >
          <t-input
            :model-value="model[field.key] ?? ''"
            @update:model-value="initField(field); model[field.key] = $event"
            :maxlength="field.maxlength"
            :show-limit-number="field.showLimitNumber"
            :placeholder="field.placeholder || `请输入${field.label}`"
          />
        </t-form-item>

        <t-form-item
          v-else-if="field.type === 'textarea'"
          :label="field.label"
          :name="field.key"
          :rules="field.required ? [{ required: true, message: `请输入${field.label}` }] : []"
          class="col-span-full"
        >
          <t-textarea
            :model-value="model[field.key] ?? ''"
            @update:model-value="initField(field); model[field.key] = $event"
            :maxlength="field.maxlength"
            :show-limit-number="field.showLimitNumber"
            :placeholder="field.placeholder || `请输入${field.label}`"
          />
        </t-form-item>

        <t-form-item
          v-else-if="field.type === 'select'"
          :label="field.label"
          :name="field.key"
          :rules="field.required ? [{ required: true, message: `请选择${field.label}` }] : []"
        >
          <t-select
            :model-value="model[field.key] ?? []"
            @update:model-value="initField(field); model[field.key] = $event"
            :options="field.options || []"
            :placeholder="field.placeholder || `请选择${field.label}`"
            class="w-full"
          />
        </t-form-item>

        <t-form-item
          v-else-if="field.type === 'switch'"
          :label="field.label"
          :name="field.key"
          class="col-span-full"
        >
          <t-switch
            :model-value="model[field.key] ?? false"
            @update:model-value="initField(field); model[field.key] = $event"
          />
        </t-form-item>

        <t-form-item
          v-else-if="field.type === 'date-picker'"
          :label="field.label"
          :name="field.key"
          :rules="field.required ? [{ required: true, message: `请选择${field.label}` }] : []"
        >
          <t-date-picker
            :model-value="model[field.key] ?? ''"
            @update:model-value="initField(field); model[field.key] = $event"
            enable-time-picker
            format="YYYY-MM-DD HH:mm:ss"
            :placeholder="field.placeholder || `请选择${field.label}`"
            clearable
          />
        </t-form-item>

        <t-form-item
          v-else-if="field.type === 'radio'"
          :label="field.label"
          :name="field.key"
          :rules="field.required ? [{ required: true, message: `请选择${field.label}` }] : []"
          class="col-span-full"
        >
          <t-radio-group
            :model-value="model[field.key] ?? ''"
            @update:model-value="initField(field); model[field.key] = $event"
          >
            <t-radio
              v-for="opt in field.options || []"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </t-radio>
          </t-radio-group>
        </t-form-item>

        <t-form-item
          v-else-if="field.type === 'upload'"
          :label="field.label"
          :name="field.key"
          class="col-span-full"
        >
          <FUploadCover
            :model-value="model[field.key] ?? ''"
            @update:model-value="initField(field); model[field.key] = $event"
          />
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
