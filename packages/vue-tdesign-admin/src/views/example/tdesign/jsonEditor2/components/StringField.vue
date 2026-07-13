<script setup lang="ts">
import { computed, inject } from 'vue'
import type { StringFieldConfig, UpdateValueFn } from '../types'
import { UPDATE_VALUE_KEY } from '../types'

const props = defineProps<{
  field: StringFieldConfig
  modelValue: any
  path: (string | number)[]
}>()

const updateValue = inject<UpdateValueFn>(UPDATE_VALUE_KEY)!

const val = computed(() => props.modelValue?.[props.field.key] ?? props.field.defaultValue ?? '')
const onUpdate = (v: any) => updateValue([...props.path, props.field.key], v)
</script>

<template>
  <t-form-item
    :label="field.label"
    :name="field.key"
    :rules="field.rules"
    :required-mark="field.required"
    class="json-form-field"
  >
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

    <t-textarea
      v-else-if="field.textarea"
      :model-value="val"
      @update:model-value="onUpdate"
      :placeholder="field.placeholder"
      :maxlength="field.maxlength"
      :show-limit-number="field.showLimitNumber"
      :rows="field.rows || 3"
    />

    <t-input
      v-else
      :model-value="val"
      @update:model-value="onUpdate"
      :placeholder="field.placeholder"
      :maxlength="field.maxlength"
      :show-limit-number="field.showLimitNumber"
    />

    <template #help v-if="field.help">
      <span class="field-help">{{ field.help }}</span>
    </template>
  </t-form-item>
</template>

<style scoped>

</style>
