<script setup lang="ts">
import { computed, inject } from 'vue'
import type { BooleanFieldConfig, UpdateValueFn } from '../types'
import { UPDATE_VALUE_KEY } from '../types'

const props = defineProps<{
  field: BooleanFieldConfig
  modelValue: any
  path: (string | number)[]
}>()

const updateValue = inject<UpdateValueFn>(UPDATE_VALUE_KEY)!

const val = computed(() => props.modelValue?.[props.field.key] ?? props.field.defaultValue ?? false)
const onUpdate = (v: any) => updateValue([...props.path, props.field.key], v)
</script>

<template>
  <template v-if="field.options?.length">
    <t-form-item
      :label="field.label"
      :name="field.key"
      :rules="field.rules"
      :required-mark="field.required"
      class="json-form-field"
    >
      <t-select
        :model-value="String(val)"
        @update:model-value="onUpdate"
        :placeholder="field.placeholder"
        clearable class="w-full"
      >
        <t-option v-for="opt in field.options" :key="String(opt.value)" :value="opt.value" :label="opt.label" />
      </t-select>
      <template #help v-if="field.help">
        <span class="field-help">{{ field.help }}</span>
      </template>
    </t-form-item>
  </template>

  <t-form-item
    v-else
    :name="field.key"
    :rules="field.rules"
    :required-mark="field.required"
    class="json-form-field"
  >
    <div class="flex items-center gap-2">
      <t-switch
        :model-value="val"
        @update:model-value="onUpdate"
        :custom-value="field.switchLabel ? [false, true] : undefined"
        :label="field.switchLabel || undefined"
      />
      <label class="switch-label" v-if="field.label">
        <span v-if="field.required" class="text-red-500 mr-0.5">*</span>
        {{ field.label }}
      </label>
    </div>
    <template #help v-if="field.help">
      <span class="field-help">{{ field.help }}</span>
    </template>
  </t-form-item>
</template>

<style scoped>

.switch-label {
  font-size: 13px;
  color: #4e5969;
  font-weight: 500;
}
</style>
