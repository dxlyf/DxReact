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
  /** 嵌套对象在数组项内时，隐藏自带 header */
  hideObjectHeader?: boolean
  /** 对象字段内联模式：不额外添加 field.key 到路径（modelValue 即为对象自身） */
  inlineObject?: boolean
  /** 数组字段内联模式 */
  inlineArray?: boolean
  /** 根对象 */
  rootObject?: boolean
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
    <div v-else-if="field.valueType === 'object'" class="obj-form-field">
    <ObjectField
      ref="objRef"
      :field="field as ObjectFieldConfig"
      :model-value="modelValue"
      :path="path"
      :inline="inlineObject"
      :hide-add-button="hideObjectHeader"
      :root-object="rootObject"
    />
    </div>
    <div v-else-if="field.valueType === 'array'" class="array-form-field">
      <ArrayField   :field="field as ArrayFieldConfig" :model-value="modelValue" :path="path" :inline="inlineArray" />  
  </div>
  </template>
</template>
<style scoped>
.obj-form-field,.array-form-field{
  margin-bottom: 8px;
}
</style>