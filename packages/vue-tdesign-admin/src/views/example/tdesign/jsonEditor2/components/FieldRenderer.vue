<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FieldConfig, ObjectFieldConfig, ArrayFieldConfig } from '../types'
import { isFieldHidden } from '../utils'
import StringField from './StringField.vue'
import NumberField from './NumberField.vue'
import BooleanField from './BooleanField.vue'
import ObjectField from './ObjectField.vue'
import ArrayField from './ArrayField.vue'

const props = defineProps<{
  field: FieldConfig
  modelValue: any
  path: (string | number)[]
  /** 嵌套对象在数组项内时，可传入以隐藏自带 header */
  hideObjectHeader?: boolean
}>()

const objRef = ref<InstanceType<typeof ObjectField>>()
defineExpose({ openObjectAddDialog: () => objRef.value?.openAddDialog() })

const visible = computed(() => !isFieldHidden(props.field, props.modelValue || {}))
</script>

<template>
  <template v-if="visible">
    <StringField v-if="field.valueType === 'string'" :field="field" :model-value="modelValue" :path="path" />
    <NumberField v-else-if="field.valueType === 'number'" :field="field" :model-value="modelValue" :path="path" />
    <BooleanField v-else-if="field.valueType === 'boolean'" :field="field" :model-value="modelValue" :path="path" />
    <ObjectField
      v-else-if="field.valueType === 'object'"
      ref="objRef"
      :field="field as ObjectFieldConfig"
      :model-value="modelValue"
      :path="path"
      :hide-add-button="hideObjectHeader"
    />
    <ArrayField v-else-if="field.valueType === 'array'" :field="field as ArrayFieldConfig" :model-value="modelValue" :path="path" />
  </template>
</template>
