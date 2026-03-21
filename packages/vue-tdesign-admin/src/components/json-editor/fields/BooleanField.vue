<template>
  <t-form-item
    v-show="!schema['x-hidden']"
    :label="label"
    :name="path"
    :required="required"
    :help="showDescription ? schema.description : undefined"
    :status="errorStatus"
    :tips="errorMessage"
    :style="fieldStyle"
  >
    <template v-if="xFormat === 'switch'">
      <t-switch
        :value="modelValue as boolean"
        @update:value="handleChange"
        :disabled="mergedDisabled"
        :readonly="mergedReadonly"
        v-bind="schema['x-props']"
      />
    </template>
    <template v-else-if="xFormat === 'checkbox'">
      <t-checkbox
        :value="modelValue as boolean"
        @update:value="handleChange"
        :disabled="mergedDisabled"
        :readonly="mergedReadonly"
        v-bind="schema['x-props']"
      >
        {{ schema.title || label }}
      </t-checkbox>
    </template>
    <template v-else>
      <t-radio-group
        :value="modelValue as boolean"
        @update:value="handleChange"
        :disabled="mergedDisabled"
        v-bind="schema['x-props']"
      >
        <t-radio :value="true">是</t-radio>
        <t-radio :value="false">否</t-radio>
      </t-radio-group>
    </template>
    <template v-if="schema['x-tooltip']" #label>
      <span>{{ label }}</span>
      <t-tooltip :content="schema['x-tooltip']" placement="top">
        <t-icon name="help-circle" class="label-tooltip-icon" />
      </t-tooltip>
    </template>
  </t-form-item>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import type { JsonSchema, ValidationError, ThemeConfig } from '../types'

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
  'update:modelValue': [value: boolean]
}>()

const theme = inject<ThemeConfig>('theme', {})
const xFormat = computed(() => props.schema['x-format'])

const showDescription = computed(() => theme.showDescription ?? true)

const mergedDisabled = computed(() => {
  return props.schema['x-disabled'] ?? props.disabled
})

const mergedReadonly = computed(() => {
  return props.schema['x-readonly'] ?? props.readonly
})

const fieldStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.schema['x-width']) {
    const width = props.schema['x-width']
    style.width = typeof width === 'number' ? `${width}px` : width
  }
  return style
})

const errorStatus = computed(() => {
  if (props.errors && props.errors.length > 0) {
    return 'error'
  }
  return undefined
})

const errorMessage = computed(() => {
  if (props.errors && props.errors.length > 0) {
    return props.errors.map(e => e.message).join('、')
  }
  return undefined
})

function handleChange(value: boolean) {
  emit('update:modelValue', value)
}
</script>

<style scoped>
.label-tooltip-icon {
  margin-left: 4px;
  color: var(--td-text-color-placeholder);
  cursor: help;
}
</style>
