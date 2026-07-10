<script setup lang="ts">
import { computed, inject } from 'vue'
import type { NumberFieldConfig, UpdateValueFn } from '../types'
import { UPDATE_VALUE_KEY } from '../types'

const props = defineProps<{
  field: NumberFieldConfig
  modelValue: any
  path: (string | number)[]
}>()

const updateValue = inject<UpdateValueFn>(UPDATE_VALUE_KEY)!

const val = computed(() => props.modelValue?.[props.field.key] ?? props.field.defaultValue ?? 0)
const onUpdate = (v: any) => updateValue([...props.path, props.field.key], v)
</script>

<template>
  <div class="json-form-field">
    <label class="field-label" v-if="field.label">
      <span v-if="field.required" class="text-red-500 mr-0.5">*</span>
      {{ field.label }}
    </label>

    <t-select
      v-if="field.options?.length"
      :model-value="val"
      @update:model-value="onUpdate"
      :placeholder="field.placeholder"
      :multiple="field.multiple"
      clearable class="w-full"
    >
      <t-option v-for="opt in field.options" :key="String(opt.value)" :value="opt.value" :label="opt.label" />
    </t-select>

    <t-input-number
      v-else
      :model-value="val"
      @update:model-value="onUpdate"
      :placeholder="field.placeholder"
      :min="field.min"
      :max="field.max"
      :step="field.step ?? 1"
      :decimal-places="field.precision"
      class="w-full"
    />

    <span class="field-help" v-if="field.help">{{ field.help }}</span>
  </div>
</template>

<style scoped>
.json-form-field {
  margin-bottom: 16px;
}
.field-label {
  display: block;
  font-size: 13px;
  color: #4e5969;
  margin-bottom: 6px;
  font-weight: 500;
}
.field-help {
  display: block;
  font-size: 12px;
  color: #86909c;
  margin-top: 4px;
}
</style>
