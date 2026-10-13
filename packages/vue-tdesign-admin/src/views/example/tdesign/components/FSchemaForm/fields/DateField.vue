<script setup lang="ts">
// ============================================================================
// DateField：日期字段
// enableTimePicker / format / mode（日期区间）等通过 field.props 透传给 t-date-picker
// ============================================================================
import { computed, inject } from 'vue';
import { useFieldLayout } from '../composables/useFieldLayout';
import {
  SCHEMA_FORM_KEY,
  type DateField,
  type FieldPath,
  type SchemaFormContext,
} from '../types';

const props = defineProps<{ field: DateField; path: FieldPath }>();
const ctx = inject<SchemaFormContext>(SCHEMA_FORM_KEY)!;
const { wrapperClass, labelClass, controlClass } = useFieldLayout();

const value = computed({
  get: () => ctx.getValue(props.path) ?? '',
  set: (v: string | string[]) => ctx.setValue(props.path, v),
});
</script>

<template>
  <div :class="wrapperClass">
    <div :class="labelClass">{{ field.label }}</div>
    <div :class="controlClass">
      <t-date-picker v-model="value" class="w-full" :placeholder="field.placeholder" clearable v-bind="field.props" />
    </div>
  </div>
</template>
