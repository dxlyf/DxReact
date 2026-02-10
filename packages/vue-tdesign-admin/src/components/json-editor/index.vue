<template>
  <div class="json-editor">
    <t-form :data="formData" :rules="formRules" ref="formRef" label-width="120px">
      <template v-for="field in schema" :key="field.key">
        <json-field
          :field="field"
          :value="formData[field.key]"
          @update:value="(val) => updateValue(field.key, val)"
          @update:schema="updateSchema"
        />
      </template>
    </t-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { FormInstanceFunctions } from 'tdesign-vue-next'
import JsonField from './JsonField.vue'

export type FieldType = 'string' | 'number' | 'boolean' | 'object' | 'array'

export interface FieldSchema {
  key: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  options?: { label: string; value: any }[]
  min?: number
  max?: number
  properties?: FieldSchema[]
  items?: FieldSchema
  default?: any
  description?: string
  isCustom?: boolean
  displayMode?: 'card' | 'table' | 'tabs'
}

interface Props {
  schema: FieldSchema[]
  modelValue?: Record<string, any>
}

interface Emits {
  (e: 'update:modelValue', value: Record<string, any>): void
  (e: 'update:schema', value: FieldSchema[]): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({})
})

const emit = defineEmits<Emits>()

const formRef = ref<FormInstanceFunctions>()

const formData = reactive<Record<string, any>>({})

const initFormData = () => {
  props.schema.forEach((field) => {
    if (props.modelValue && field.key in props.modelValue) {
      formData[field.key] = props.modelValue[field.key]
    } else if (field.default !== undefined) {
      formData[field.key] = field.default
    } else {
      switch (field.type) {
        case 'string':
          formData[field.key] = ''
          break
        case 'number':
          formData[field.key] = 0
          break
        case 'boolean':
          formData[field.key] = false
          break
        case 'object':
          formData[field.key] = {}
          break
        case 'array':
          formData[field.key] = []
          break
      }
    }
  })
}

const formRules = computed(() => {
  const rules: Record<string, any> = {}

  props.schema.forEach((field) => {
    if (field.required) {
      rules[field.key] = [
        { required: true, message: `${field.label}不能为空`, type: 'error', trigger: 'blur' }
      ]
    }

    if (field.type === 'string') {
      if (field.min !== undefined || field.max !== undefined) {
        const fieldRules = rules[field.key] || []
        if (field.min !== undefined) {
          fieldRules.push({
            min: field.min,
            message: `${field.label}长度不能少于${field.min}个字符`,
            type: 'warning',
            trigger: 'blur'
          })
        }
        if (field.max !== undefined) {
          fieldRules.push({
            max: field.max,
            message: `${field.label}长度不能超过${field.max}个字符`,
            type: 'warning',
            trigger: 'blur'
          })
        }
        rules[field.key] = fieldRules
      }
    }

    if (field.type === 'number') {
      const fieldRules = rules[field.key] || []
      if (field.min !== undefined) {
        fieldRules.push({
          min: field.min,
          message: `${field.label}不能小于${field.min}`,
          type: 'warning',
          trigger: 'blur'
        })
      }
      if (field.max !== undefined) {
        fieldRules.push({
          max: field.max,
          message: `${field.label}不能大于${field.max}`,
          type: 'warning',
          trigger: 'blur'
        })
      }
      rules[field.key] = fieldRules
    }
  })

  return rules
})

const updateValue = (key: string, value: any) => {
  formData[key] = value
  emit('update:modelValue', { ...formData })
}

const updateSchema = (updatedField: FieldSchema) => {
  const newSchema = props.schema.map(field => {
    if (field.key === updatedField.key) {
      return updatedField
    }
    return field
  })
  emit('update:schema', newSchema)
}

const validate = async () => {
  try {
    const result = await formRef.value?.validate()
    return result === true
  } catch (error) {
    return false
  }
}

const reset = () => {
  formRef.value?.reset()
  initFormData()
}

const getData = () => {
  return { ...formData }
}

watch(
  () => props.modelValue,
  () => {
    initFormData()
  },
  { deep: true }
)

watch(
  () => props.schema,
  (newSchema) => {
    newSchema.forEach((field) => {
      if (!(field.key in formData)) {
        if (field.default !== undefined) {
          formData[field.key] = field.default
        } else {
          switch (field.type) {
            case 'string':
              formData[field.key] = ''
              break
            case 'number':
              formData[field.key] = 0
              break
            case 'boolean':
              formData[field.key] = false
              break
            case 'object':
              formData[field.key] = {}
              break
            case 'array':
              formData[field.key] = []
              break
          }
        }
      }
    })
  },
  { deep: true }
)

initFormData()

defineExpose({
  validate,
  reset,
  getData
})
</script>

<style scoped>
.json-editor {
  padding: 16px;
}
</style>
