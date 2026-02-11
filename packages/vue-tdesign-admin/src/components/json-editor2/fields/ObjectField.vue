<template>
  <div class="object-field">
    <div class="object-header">
      <h4>{{ label }}<span v-if="required" class="required">*</span></h4>
      <div v-if="schema.description" class="field-description">
        {{ schema.description }}
      </div>
    </div>
    
    <div class="object-content">
      <div v-for="field in childFields" :key="field.key" class="child-field">
        <component
          :is="field.component"
          :schema="field.schema"
          :modelValue="getChildValue(field.path)"
          @update:modelValue="updateChildValue(field.path, $event)"
          :label="field.label"
          :required="field.required"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { generateFields, getComponentType } from '../utils/schemaUtils'

const props = defineProps({
  schema: {
    type: Object,
    required: true
  },
  modelValue: {
    type: Object,
    default: () => ({})
  },
  label: String,
  required: Boolean
})

const emit = defineEmits(['update:modelValue'])

// 生成子字段
const childFields = computed(() => {
  if (!props.schema.properties) return []
  
  return Object.keys(props.schema.properties).map(key => {
    const propSchema = props.schema.properties[key]
    const path = key // 对于对象字段，路径就是属性名
    
    return {
      key: path,
      path: path,
      label: propSchema.title || key,
      schema: propSchema,
      required: props.schema.required?.includes(key) || false,
      component: getComponentType({ schema: propSchema })
    }
  })
})

// 获取子字段的值
function getChildValue(path) {
  return props.modelValue?.[path]
}

// 更新子字段的值
function updateChildValue(path, value) {
  const newValue = {
    ...props.modelValue,
    [path]: value
  }
  emit('update:modelValue', newValue)
}
</script>

<style scoped>
.object-field {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 16px;
  background: #fafafa;
}

.object-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.object-header h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.object-content {
  padding-left: 10px;
}

.child-field {
  margin-bottom: 12px;
}

.required {
  color: #ff4444;
  margin-left: 4px;
}

.field-description {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}
</style>