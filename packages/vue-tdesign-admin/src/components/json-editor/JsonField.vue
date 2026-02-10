<template>
  <t-form-item :name="field.key" :label="field.label">
    <template v-if="field.description" #label>
      <div class="field-label">
        <span>{{ field.label }}</span>
        <t-tooltip :content="field.description">
          <template #default>
            <t-icon name="info-circle" size="14px" />
          </template>
        </t-tooltip>
      </div>
    </template>
    
    <t-input
      v-if="field.type === 'string' && !field.options"
      v-model="localValue"
      :placeholder="field.placeholder"
      @update:model-value="handleUpdate"
    />
    
    <t-select
      v-if="field.type === 'string' && field.options"
      v-model="localValue"
      :placeholder="field.placeholder"
      @update:model-value="handleUpdate"
    >
      <t-option
        v-for="option in field.options"
        :key="option.value"
        :value="option.value"
        :label="option.label"
      />
    </t-select>
    
    <t-input-number
      v-if="field.type === 'number'"
      v-model="localValue"
      :placeholder="field.placeholder"
      :min="field.min"
      :max="field.max"
      @update:model-value="handleUpdate"
    />
    
    <t-checkbox
      v-if="field.type === 'boolean'"
      v-model="localValue"
      @update:model-value="handleUpdate"
    >
      {{ field.placeholder || field.label }}
    </t-checkbox>
    
    <json-object-field
      v-if="field.type === 'object'"
      :schema="field.properties"
      :model-value="localValue"
      @update:model-value="handleUpdate"
      @remove-property="handleRemoveProperty"
      @update:schema="handleUpdateSchema"
    />
    
    <json-array-field
      v-if="field.type === 'array'"
      :schema="field.items"
      :model-value="localValue"
      @update:model-value="handleUpdate"
    />
    
    <t-button
      v-if="field.isCustom"
      size="small"
      variant="text"
      theme="danger"
      class="remove-btn"
      @click="handleRemove"
    >
      <t-icon name="delete" />
    </t-button>
  </t-form-item>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import JsonObjectField from './JsonObjectField.vue'
import JsonArrayField from './JsonArrayField.vue'
import type { FieldSchema } from './index.vue'

interface Props {
  field: FieldSchema
  value: any
}

interface Emits {
  (e: 'update:value', value: any): void
  (e: 'remove-property', key: string): void
  (e: 'update:schema', value: FieldSchema): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localValue = ref(props.value)

watch(() => props.value, (newVal) => {
  localValue.value = newVal
})

const handleUpdate = (val: any) => {
  localValue.value = val
  emit('update:value', val)
}

const handleRemoveProperty = (key: string) => {
  emit('remove-property', key)
}

const handleRemove = () => {
  emit('remove-property', props.field.key)
}

const handleUpdateSchema = (newProperties: FieldSchema[]) => {
  emit('update:schema', {
    ...props.field,
    properties: newProperties
  })
}
</script>

<style scoped>
.field-label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.remove-btn {
  position: absolute;
  right: 0;
  top: 0;
}
</style>
