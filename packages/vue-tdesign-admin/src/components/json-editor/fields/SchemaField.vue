<template>
  <component
    :is="fieldComponent"
    :schema="schema"
    :model-value="modelValue"
    :path="path"
    :label="label"
    :required="required"
    :disabled="disabled"
    :readonly="readonly"
    :errors="errors"
    @update:model-value="handleUpdate"
  />
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import type { JsonSchema, ValidationError } from '../types'
import StringField from './StringField.vue'
import NumberField from './NumberField.vue'
import BooleanField from './BooleanField.vue'
import ObjectField from './ObjectField.vue'
import ArrayField from './ArrayField.vue'

interface Props {
  schema: JsonSchema
  modelValue: unknown
  path: string
  label?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  errors?: ValidationError[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: unknown]
}>()

const fieldComponent = computed((): Component => {
  const schemaType = Array.isArray(props.schema.type) 
    ? props.schema.type[0] 
    : props.schema.type

  switch (schemaType) {
    case 'string':
      return StringField
    case 'number':
    case 'integer':
      return NumberField
    case 'boolean':
      return BooleanField
    case 'object':
      return ObjectField
    case 'array':
      return ArrayField
    default:
      return StringField
  }
})

function handleUpdate(value: unknown) {
  emit('update:modelValue', value)
}
</script>
