<template>
  <div class="json-schema-form">
    <form @submit.prevent="handleSubmit">
      <div v-for="field in formFields" :key="field.key" class="form-field">
        <component
          :is="getComponentType(field)"
          :schema="field.schema"
          :modelValue="getValue(field.path)"
          @update:modelValue="setValue(field.path, $event)"
          :label="field.label"
          :required="field.required"
        />
      </div>
      
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">提交</button>
        <button type="button" @click="resetForm" class="btn btn-secondary">重置</button>
      </div>
    </form>
    
    <div class="json-preview">
      <h3>JSON预览：</h3>
      <pre>{{ formattedData }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import StringField from './fields/StringField.vue'
import NumberField from './fields/NumberField.vue'
import BooleanField from './fields/BooleanField.vue'
import ArrayField from './fields/ArrayField.vue'
import ObjectField from './fields/ObjectField.vue'

const props = defineProps({
  schema: {
    type: Object,
    required: true
  },
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])

// 本地数据副本
const formData = ref({ ...props.modelValue })

// 当外部数据变化时更新本地数据
watch(() => props.modelValue, (newValue) => {
  formData.value = { ...newValue }
}, { deep: true })

// 生成表单字段
const formFields = computed(() => {
  return generateFields(props.schema)
})

// 根据schema生成字段配置
function generateFields(schema, path = '') {
  const fields = []
  
  if (schema.type === 'object' && schema.properties) {
    Object.keys(schema.properties).forEach(key => {
      const propSchema = schema.properties[key]
      const fieldPath = path ? `${path}.${key}` : key
      
      fields.push({
        key: fieldPath,
        path: fieldPath,
        label: propSchema.title || key,
        schema: propSchema,
        required: schema.required?.includes(key) || false
      })
    })
  }
  
  return fields
}

// 根据schema类型获取对应的组件
function getComponentType(field) {
  const schema = field.schema
  
  if (schema.type === 'string') {
    if (schema.enum) return 'select-field' // 枚举类型使用下拉框
    if (schema.format === 'textarea') return 'textarea-field'
    return StringField
  } else if (schema.type === 'number' || schema.type === 'integer') {
    return NumberField
  } else if (schema.type === 'boolean') {
    return BooleanField
  } else if (schema.type === 'array') {
    return ArrayField
  } else if (schema.type === 'object') {
    return ObjectField
  }
  
  return StringField
}

// 获取嵌套属性的值
function getValue(path) {
  return path.split('.').reduce((obj, key) => obj?.[key], formData.value)
}

// 设置嵌套属性的值
function setValue(path, value) {
  const keys = path.split('.')
  const lastKey = keys.pop()
  const target = keys.reduce((obj, key) => {
    if (!obj[key]) obj[key] = {}
    return obj[key]
  }, formData.value)
  
  if (value === undefined || value === null) {
    delete target[lastKey]
  } else {
    target[lastKey] = value
  }
  
  emit('update:modelValue', formData.value)
}

// 提交表单
function handleSubmit() {
  emit('submit', formData.value)
}

// 重置表单
function resetForm() {
  formData.value = {}
  emit('update:modelValue', {})
}

// JSON预览
const formattedData = computed(() => {
  return JSON.stringify(formData.value, null, 2)
})
</script>

<style scoped>
.json-schema-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 20px;
}

.form-field {
  margin-bottom: 16px;
}

.form-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.json-preview {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 16px;
  background: #f5f5f5;
  max-height: 500px;
  overflow: auto;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}
</style>