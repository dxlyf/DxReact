<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import type { ObjectFieldConfig, ArrayFieldConfig, UpdateValueFn } from '../types'
import { UPDATE_VALUE_KEY } from '../types'
import { setInPath } from '../utils'
import FieldRenderer from './FieldRenderer.vue'

const props =withDefaults( defineProps<{
  schema: ObjectFieldConfig | ArrayFieldConfig
  modelValue: any
  labelAlign?:'top'|'left'|'right'
}>(),{
  labelAlign:'right'
})
const emit = defineEmits<{
  'update:modelValue': [value: any]
  change: [value: any]
}>()

const formRef = ref()
const validate = () => formRef.value?.validate()

defineExpose({ validate })

const updateValue: UpdateValueFn = (path: (string | number)[], value: any) => {
  const newVal = setInPath(props.modelValue, path, value)
  emit('update:modelValue', newVal)
  emit('change', newVal)
}
provide(UPDATE_VALUE_KEY, updateValue)

const isArray = computed(() => props.schema.valueType === 'array')
</script>

<template>
  <t-form ref="formRef" :label-align="labelAlign" :data="modelValue" class="json-form-v2">
    <FieldRenderer
      :field="schema"
      :model-value="modelValue"
      :path="[]"
      :inline-array="isArray"
      :root-object="!isArray"
    />
  </t-form>
</template>

<style scoped>
.json-form-v2 {
  width: 100%;
}
</style>
