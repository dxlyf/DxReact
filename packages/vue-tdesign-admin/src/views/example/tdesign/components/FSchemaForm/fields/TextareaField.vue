<script setup lang="ts">
// ============================================================================
// TextareaField：文本域字段
// autosize / maxlength 等通过 field.props 透传给 t-textarea
// ============================================================================
import { computed, inject } from 'vue';
import { useFieldLayout } from '../composables/useFieldLayout';
import {
  SCHEMA_FORM_KEY,
  type FieldPath,
  type SchemaFormContext,
  type TextareaField,
} from '../types';

const props = defineProps<{ field: TextareaField; path: FieldPath }>();
const ctx = inject<SchemaFormContext>(SCHEMA_FORM_KEY)!;
const { wrapperClass, labelClass, controlClass } = useFieldLayout();

const value = computed({
  get: () => ctx.getValue(props.path) ?? '',
  set: (v: string) => ctx.setValue(props.path, v),
});
</script>

<template>
  <div :class="wrapperClass">
    <div :class="labelClass">{{ field.label }}</div>
    <div :class="controlClass">
      <t-textarea v-model="value" :placeholder="field.placeholder" clearable v-bind="field.props" />
    </div>
  </div>
</template>
