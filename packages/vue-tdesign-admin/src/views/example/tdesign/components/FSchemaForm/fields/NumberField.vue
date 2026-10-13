<script setup lang="ts">
// ============================================================================
// NumberField：数字字段
// ============================================================================
import { computed, inject } from 'vue';
import { useFieldLayout } from '../composables/useFieldLayout';
import {
  SCHEMA_FORM_KEY,
  type FieldPath,
  type NumberField,
  type SchemaFormContext,
} from '../types';

const props = defineProps<{ field: NumberField; path: FieldPath }>();
const ctx = inject<SchemaFormContext>(SCHEMA_FORM_KEY)!;
const { wrapperClass, labelClass, controlClass } = useFieldLayout();

const value = computed({
  get: () => ctx.getValue(props.path),
  set: (v: number | undefined) => ctx.setValue(props.path, v),
});
</script>

<template>
  <div :class="wrapperClass">
    <div :class="labelClass">{{ field.label }}</div>
    <div :class="controlClass">
      <t-input-number
        v-model="value"
        class="w-full"
        :placeholder="field.placeholder"
        :min="field.min"
        :max="field.max"
        v-bind="field.props"
      />
    </div>
  </div>
</template>
