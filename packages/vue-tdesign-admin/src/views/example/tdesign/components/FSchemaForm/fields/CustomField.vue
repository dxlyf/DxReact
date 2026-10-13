<script setup lang="ts">
// ============================================================================
// CustomField：自定义字段
// 渲染任意组件：可传全局注册的组件名（如 't-input' / 't-select' / 't-table'）
// 或组件对象。其余配置通过 field.props 透传。
// 默认与表单值双向绑定；t-table 等只读组件可将 bindValue 设为 false。
// ============================================================================
import { computed, inject } from 'vue';
import { useFieldLayout } from '../composables/useFieldLayout';
import {
  SCHEMA_FORM_KEY,
  type CustomField,
  type FieldPath,
  type SchemaFormContext,
} from '../types';

const props = defineProps<{ field: CustomField; path: FieldPath }>();
const ctx = inject<SchemaFormContext>(SCHEMA_FORM_KEY)!;
const { wrapperClass, labelClass, controlClass } = useFieldLayout();

// 是否与表单值双向绑定（默认 true）
const bindValue = computed(() => props.field.bindValue !== false);

// 通过上下文的路径读写与顶层值双向绑定
const value = computed({
  get: () => ctx.getValue(props.path),
  set: (v: any) => ctx.setValue(props.path, v),
});

function onUpdate(v: any) {
  if (bindValue.value) value.value = v;
}
</script>

<template>
  <div :class="wrapperClass">
    <div :class="labelClass">{{ field.label }}</div>
    <div :class="controlClass">
      <component
        :is="field.component"
        v-bind="field.props"
        :model-value="bindValue ? value : undefined"
        @update:model-value="onUpdate"
      />
    </div>
  </div>
</template>
