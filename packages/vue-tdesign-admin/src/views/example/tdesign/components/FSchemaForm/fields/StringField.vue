<script setup lang="ts">
// ============================================================================
// StringField：字符串字段
// ============================================================================
import { computed, inject } from 'vue';
import { useFieldLayout } from '../composables/useFieldLayout';
import {
  SCHEMA_FORM_KEY,
  type FieldPath,
  type SchemaFormContext,
  type StringField,
} from '../types';

const props = defineProps<{ field: StringField; path: FieldPath }>();
const ctx = inject<SchemaFormContext>(SCHEMA_FORM_KEY)!;
const { wrapperClass, labelClass, controlClass } = useFieldLayout();

// 通过上下文的路径读写与顶层值双向绑定
const value = computed({
  get: () => ctx.getValue(props.path) ?? '',
  set: (v: string) => ctx.setValue(props.path, v),
});
</script>

<template>
  <div :class="wrapperClass">
    <div :class="labelClass">{{ field.label }}</div>
    <div :class="controlClass">
      <t-input v-model="value" :placeholder="field.placeholder" clearable v-bind="field.props" />
    </div>
  </div>
</template>
