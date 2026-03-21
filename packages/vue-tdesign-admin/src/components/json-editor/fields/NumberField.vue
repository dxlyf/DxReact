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
    <template v-if="schema.enum && schema.enum.length > 0">
      <t-select
        :value="modelValue as number"
        @update:value="handleChange"
        :placeholder="placeholder"
        :disabled="mergedDisabled"
        :readonly="mergedReadonly"
        :clearable="!required"
        v-bind="schema['x-props']"
      >
        <t-option
          v-for="item in enumOptions"
          :key="Number(item.value)"
          :value="item.value as number"
          :label="item.label"
          :disabled="item.disabled"
        />
      </t-select>
    </template>
    <template v-else-if="xFormat === 'rate'">
      <div class="rate-field">
        <t-rate
          :value="modelValue as number"
          @update:value="handleChange"
          :disabled="mergedDisabled"
          :count="schema['x-rate-max'] || 5"
          :allow-half="schema['x-rate-allow-half']"
          v-bind="schema['x-props']"
        />
        <span v-if="modelValue !== undefined && modelValue !== null" class="rate-value">
          {{ modelValue }}
        </span>
      </div>
    </template>
    <template v-else-if="xFormat === 'slider'">
      <div class="slider-field">
        <t-slider
          :value="modelValue as number"
          @update:value="handleChange"
          :disabled="mergedDisabled"
          :min="schema['x-slider-min'] ?? schema.minimum ?? 0"
          :max="schema['x-slider-max'] ?? schema.maximum ?? 100"
          :step="schema['x-slider-step'] ?? 1"
          :show-input="schema['x-slider-show-input']"
          :range="schema['x-slider-range']"
          v-bind="schema['x-props']"
        />
      </div>
    </template>
    <template v-else>
      <t-input-number
        :value="modelValue as number"
        @update:value="handleChange"
        :placeholder="placeholder"
        :disabled="mergedDisabled"
        :readonly="mergedReadonly"
        :min="minValue"
        :max="maxValue"
        :step="schema.multipleOf || 1"
        :decimal-places="decimalPlaces"
        theme="column"
        style="width: 100%"
        v-bind="schema['x-props']"
      />
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
  'update:modelValue': [value: number]
}>()

const theme = inject<ThemeConfig>('theme', {})
const xFormat = computed(() => props.schema['x-format'])

const showDescription = computed(() => theme.showDescription ?? true)

const placeholder = computed(() => {
  return props.schema['x-placeholder'] || `请输入${props.label || ''}`
})

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

const minValue = computed(() => {
  if (typeof props.schema.exclusiveMinimum === 'number') {
    return props.schema.exclusiveMinimum
  }
  if (props.schema.exclusiveMinimum === true) {
    return props.schema.minimum !== undefined ? props.schema.minimum + 1 : undefined
  }
  return props.schema.minimum
})

const maxValue = computed(() => {
  if (typeof props.schema.exclusiveMaximum === 'number') {
    return props.schema.exclusiveMaximum
  }
  if (props.schema.exclusiveMaximum === true) {
    return props.schema.maximum !== undefined ? props.schema.maximum - 1 : undefined
  }
  return props.schema.maximum
})

const decimalPlaces = computed(() => {
  if (props.schema.type === 'integer') {
    return 0
  }
  if (props.schema.multipleOf) {
    const str = String(props.schema.multipleOf)
    const decimalIndex = str.indexOf('.')
    if (decimalIndex !== -1) {
      return str.length - decimalIndex - 1
    }
  }
  return undefined
})

const enumOptions = computed(() => {
  if (props.schema['x-enum-options']) {
    return props.schema['x-enum-options']
  }
  if (props.schema.enum) {
    return props.schema.enum.map(item => ({
      label: String(item),
      value: item,
      disabled: false
    }))
  }
  return []
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

function handleChange(value: number) {
  emit('update:modelValue', value)
}
</script>

<style scoped>
.rate-field {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rate-value {
  color: var(--td-text-color-secondary);
  font-size: 14px;
}

.slider-field {
  width: 100%;
}

.label-tooltip-icon {
  margin-left: 4px;
  color: var(--td-text-color-placeholder);
  cursor: help;
}
</style>
