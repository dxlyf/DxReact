<template>
  <div class="array-field">
    <label>{{ label }}<span v-if="required" class="required">*</span></label>
    <div class="array-items">
      <div v-for="(item, index) in items" :key="index" class="array-item">
        <component
          :is="itemComponent"
          :schema="itemSchema"
          :modelValue="item"
          @update:modelValue="updateItem(index, $event)"
        />
        <button type="button" @click="removeItem(index)" class="btn-remove">×</button>
      </div>
    </div>
    <button type="button" @click="addItem" class="btn-add">添加项</button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import StringField from './StringField.vue'
import NumberField from './NumberField.vue'
import BooleanField from './BooleanField.vue'

const props = defineProps({
  schema: Object,
  modelValue: Array,
  label: String,
  required: Boolean
})

const emit = defineEmits(['update:modelValue'])

const items = computed(() => props.modelValue || [])

// 获取数组项的schema
const itemSchema = computed(() => props.schema.items || { type: 'string' })

// 根据数组项类型获取组件
const itemComponent = computed(() => {
  const type = itemSchema.value.type
  switch (type) {
    case 'number':
    case 'integer':
      return NumberField
    case 'boolean':
      return BooleanField
    case 'object':
      return 'object-field'
    case 'array':
      return 'array-field'
    default:
      return StringField
  }
})

// 添加新项
function addItem() {
  const newItems = [...(props.modelValue || [])]
  newItems.push(getDefaultValue(itemSchema.value))
  emit('update:modelValue', newItems)
}

// 更新项
function updateItem(index, value) {
  const newItems = [...(props.modelValue || [])]
  newItems[index] = value
  emit('update:modelValue', newItems)
}

// 删除项
function removeItem(index) {
  const newItems = [...(props.modelValue || [])]
  newItems.splice(index, 1)
  emit('update:modelValue', newItems)
}

// 获取默认值
function getDefaultValue(schema) {
  switch (schema.type) {
    case 'string':
      return schema.default || ''
    case 'number':
    case 'integer':
      return schema.default || 0
    case 'boolean':
      return schema.default || false
    case 'array':
      return schema.default || []
    case 'object':
      return schema.default || {}
    default:
      return null
  }
}
</script>

<style scoped>
.array-items {
  margin: 8px 0;
}

.array-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.btn-remove {
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  flex-shrink: 0;
}

.btn-add {
  background: #007bff;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}
</style>