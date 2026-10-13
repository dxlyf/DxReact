<script setup lang="ts">
// ============================================================================
// TableCell：表格单元格控件
// 按列配置的 type 渲染对应控件；custom 类型可渲染任意组件
// ============================================================================
import { computed, inject } from 'vue';
import {
  SCHEMA_FORM_KEY,
  type FieldPath,
  type SchemaFormContext,
  type TableColumn,
} from '../types';

const props = defineProps<{ column: TableColumn; path: FieldPath }>();
const ctx = inject<SchemaFormContext>(SCHEMA_FORM_KEY)!;

const type = computed(() => props.column.type ?? 'string');
const bindValue = computed(() => props.column.bindValue !== false);

const value = computed({
  get: () => ctx.getValue(props.path),
  set: (v: any) => ctx.setValue(props.path, v),
});

// 自定义组件仅在 bindValue 时回写行值
function onUpdate(v: any) {
  if (bindValue.value) value.value = v;
}
</script>

<template>
  <template v-if="type === 'custom'">
    <component
      :is="column.component"
      v-bind="column.props"
      :model-value="bindValue ? value : undefined"
      @update:model-value="onUpdate"
    />
  </template>
  <t-input
    v-else-if="type === 'string'"
    v-model="value"
    :placeholder="column.placeholder"
    clearable
    v-bind="column.props"
  />
  <t-input-number
    v-else-if="type === 'number'"
    v-model="value"
    class="w-full"
    :placeholder="column.placeholder"
    v-bind="column.props"
  />
  <t-select
    v-else-if="type === 'select'"
    v-model="value"
    class="w-full"
    :placeholder="column.placeholder"
    clearable
    v-bind="column.props"
  />
  <t-textarea
    v-else-if="type === 'textarea'"
    v-model="value"
    :placeholder="column.placeholder"
    clearable
    v-bind="column.props"
  />
  <t-date-picker
    v-else-if="type === 'date'"
    v-model="value"
    class="w-full"
    :placeholder="column.placeholder"
    clearable
    v-bind="column.props"
  />
</template>
