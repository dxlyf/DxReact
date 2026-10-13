<script setup lang="ts">
// ============================================================================
// TableField：表格字段
// - 可配置列（列名 / 标题 / 宽度 / 单元格控件类型）
// - 最右侧操作列删除当前行；下方「添加行」
// - sortable 时最左侧显示拖拽列，原生 HTML5 拖拽排序
// ============================================================================
import { DialogPlugin } from 'tdesign-vue-next';
import { computed, inject, ref } from 'vue';
import {
  SCHEMA_FORM_KEY,
  type FieldPath,
  type SchemaFormContext,
  type TableField,
} from '../types';
import { buildTableRowDefault } from '../utils/value';
import TableCell from './TableCell.vue';

const props = defineProps<{ field: TableField; path: FieldPath }>();
const ctx = inject<SchemaFormContext>(SCHEMA_FORM_KEY)!;

// 行数据即 value 数组，行序即语义顺序
const rows = computed<any[]>(() => {
  const v = ctx.getValue(props.path);
  return Array.isArray(v) ? v : [];
});

const sortable = computed(() => !!props.field.sortable);
const removable = computed(() => props.field.removable !== false);
const addable = computed(() => props.field.addable !== false);
const isMaxed = computed(
  () => props.field.maxItems != null && rows.value.length >= props.field.maxItems,
);
const colSpan = computed(
  () => props.field.columns.length + (sortable.value ? 1 : 0) + (removable.value ? 1 : 0),
);

function columnWidth(width?: string | number): string | undefined {
  if (width == null) return undefined;
  return typeof width === 'number' ? `${width}px` : width;
}

/** 添加行：按列配置的默认值初始化 */
function addRow() {
  if (isMaxed.value) return;
  ctx.setValue(props.path, [...rows.value, buildTableRowDefault(props.field.columns)]);
}

/** 行标题：取首列的值，为空时回退为「第 N 行」 */
function rowLabel(index: number): string {
  const first = props.field.columns[0];
  const val = first ? rows.value[index]?.[first.key] : undefined;
  return val != null && val !== '' ? String(val) : `第 ${index + 1} 行`;
}

/** 删除行（二次确认） */
function removeRow(index: number) {
  const dialog = DialogPlugin.confirm({
    header: '删除确认',
    body: `确认删除「${rowLabel(index)}」吗？`,
    theme: 'danger',
    onConfirm: () => {
      ctx.setValue(
        props.path,
        rows.value.filter((_, i) => i !== index),
      );
      dialog.destroy();
    },
    onCancel: () => dialog.destroy(),
    onClose: () => dialog.destroy(),
  });
}

// ------------------------ 拖拽排序（原生 HTML5 拖拽） ------------------------
const dragIndex = ref<number | null>(null);

function onDragStart(index: number) {
  dragIndex.value = index;
}

function onDrop(index: number) {
  const from = dragIndex.value;
  dragIndex.value = null;
  if (from === null || from === index) return;
  const next = [...rows.value];
  const [moved] = next.splice(from, 1);
  next.splice(index, 0, moved);
  ctx.setValue(props.path, next);
}
</script>

<template>
  <div class="mb-3">
    <div class="block text-sm text-gray-700 mb-1">{{ field.label }}</div>
    <div class="overflow-x-auto border border-solid border-gray-200 rounded-md">
      <table class="w-full table-fixed text-sm">
        <colgroup>
          <col v-if="sortable" style="width: 40px" />
          <col v-for="col in field.columns" :key="col.key" :style="{ width: columnWidth(col.width) }" />
          <col v-if="removable" style="width: 80px" />
        </colgroup>
        <thead>
          <tr class="bg-gray-50 text-left text-gray-600">
            <th v-if="sortable" class="px-2 py-2"></th>
            <th v-for="col in field.columns" :key="col.key" class="px-2 py-2 font-medium">
              {{ col.title }}
            </th>
            <th v-if="removable" class="px-2 py-2 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(_row, idx) in rows" :key="idx" class="border-t border-solid border-gray-100">
            <td
              v-if="sortable"
              class="px-2 py-2 text-center align-middle"
              draggable="true"
              @dragstart="onDragStart(idx)"
              @dragover.prevent
              @drop="onDrop(idx)"
              @dragend="dragIndex = null"
            >
              <svg
                class="inline-block align-middle text-gray-400 cursor-move"
                viewBox="0 0 16 16"
                width="14"
                height="14"
                fill="currentColor"
              >
                <circle cx="5" cy="4" r="1.4" />
                <circle cx="11" cy="4" r="1.4" />
                <circle cx="5" cy="8" r="1.4" />
                <circle cx="11" cy="8" r="1.4" />
                <circle cx="5" cy="12" r="1.4" />
                <circle cx="11" cy="12" r="1.4" />
              </svg>
            </td>
            <td v-for="col in field.columns" :key="col.key" class="px-2 py-2 align-middle">
              <TableCell :column="col" :path="[...path, idx, col.key]" />
            </td>
            <td v-if="removable" class="px-2 py-2 align-middle">
              <t-button theme="danger" variant="text" size="small" @click="removeRow(idx)">
                删除
              </t-button>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td :colspan="colSpan" class="px-2 py-6 text-center text-gray-400 text-sm">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="addable && !isMaxed" class="mt-2">
      <t-button theme="primary" variant="outline" size="small" @click="addRow">添加行</t-button>
    </div>
  </div>
</template>
