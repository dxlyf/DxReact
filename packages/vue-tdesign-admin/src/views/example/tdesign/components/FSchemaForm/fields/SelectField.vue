<script setup lang="ts">
// ============================================================================
// SelectField：下拉字段
// 选项 / 多选 / 可搜索等均通过 field.props 透传给 t-select
// ============================================================================
import { computed, inject } from 'vue';
import { useFieldLayout } from '../composables/useFieldLayout';
import {
  SCHEMA_FORM_KEY,
  type FieldPath,
  type SchemaFormContext,
  type SelectField,
  type SelectValue,
} from '../types';

const props = defineProps<{ field: SelectField; path: FieldPath }>();
const ctx = inject<SchemaFormContext>(SCHEMA_FORM_KEY)!;
const { wrapperClass, labelClass, controlClass } = useFieldLayout();

const value = computed({
  get: () => ctx.getValue(props.path),
  set: (v: SelectValue) => ctx.setValue(props.path, v),
});
</script>

<template>
  <div :class="wrapperClass">
    <div :class="labelClass">{{ field.label }}</div>
    <div :class="controlClass">
      <t-select v-model="value" class="w-full" :placeholder="field.placeholder" clearable v-bind="field.props" />
    </div>
  </div>
</template>
