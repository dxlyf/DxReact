<script setup lang="ts">
// ============================================================================
// StringArrayField：字符串数组字段
// - 结构与 ArrayField 类似：卡片 + Tabs（每项一个 tab）+ 添加项
// - 每项渲染一个文本域（默认）或单行文本输入框（itemType='text'）
// - field.props 透传给每项控件；支持拖拽排序与移除二次确认
// ============================================================================
import { DialogPlugin } from 'tdesign-vue-next';
import { computed, inject, ref, watch } from 'vue';
import CollapseCard from '../components/CollapseCard.vue';
import {
  SCHEMA_FORM_KEY,
  type FieldPath,
  type SchemaFormContext,
  type StringArrayField,
} from '../types';

const props = defineProps<{ field: StringArrayField; path: FieldPath }>();
const ctx = inject<SchemaFormContext>(SCHEMA_FORM_KEY)!;

// 收起/展开属于内部 UI state，不进入 value
const collapsed = ref(props.field.defaultCollapsed ?? false);

// 数组值即 tab 顺序，位置索引即语义索引
const items = computed<string[]>(() => {
  const v = ctx.getValue(props.path);
  return Array.isArray(v) ? v : [];
});

const activeTab = ref('0');
const removable = computed(() => props.field.removable !== false);
const addable = computed(() => props.field.addable !== false);
const useTextarea = computed(() => props.field.itemType !== 'text');
const isMaxed = computed(
  () => props.field.maxItems != null && items.value.length >= props.field.maxItems,
);

/** tab 标题：优先用 field.getItemLabel，否则有值时显示「序号. 值」，无值时「项 N」 */
function itemLabel(index: number, item: string): string {
  if (props.field.getItemLabel) return props.field.getItemLabel(index, item);
  const text = item != null && item !== '' ? String(item) : '';
  return text ? `${index + 1}. ${text}` : `项 ${index + 1}`;
}

// 每项的值：读写路径为 [...path, index]
function itemValue(index: number): string {
  const v = ctx.getValue([...props.path, index]);
  return v == null ? '' : String(v);
}

function setItemValue(index: number, value: any) {
  ctx.setValue([...props.path, index], value == null ? '' : String(value));
}

/** 添加项：追加空字符串作为新项 */
function addItem() {
  if (isMaxed.value) return;
  const next = [...items.value, ''];
  ctx.setValue(props.path, next);
  activeTab.value = String(next.length - 1);
}

/** 移除项（二次确认） */
function removeItem(index: number) {
  const dialog = DialogPlugin.confirm({
    header: '删除确认',
    body: `确认删除「${itemLabel(index, items.value[index])}」吗？`,
    theme: 'danger',
    onConfirm: () => {
      ctx.setValue(
        props.path,
        items.value.filter((_, i) => i !== index),
      );
      dialog.destroy();
    },
    onCancel: () => dialog.destroy(),
    onClose: () => dialog.destroy(),
  });
}

function onRemove(ctxArg: any) {
  removeItem(Number(ctxArg?.value));
}

function onTabChange(val: any) {
  activeTab.value = String(val);
}

// ------------------------ 拖拽排序（t-tabs 内置 dragSort） ------------------------
// 拖拽由 t-tabs 自行处理 DOM，松手后触发 onDragSort；这里只按索引重排数据
function onDragSort({ currentIndex, targetIndex }: { currentIndex: number; targetIndex: number }) {
  if (currentIndex === targetIndex) return;
  const next = [...items.value];
  const [moved] = next.splice(currentIndex, 1);
  next.splice(targetIndex, 0, moved);
  ctx.setValue(props.path, next);
  activeTab.value = String(targetIndex);
}

// 项数变化时修正 activeTab，避免越界
watch(
  () => items.value.length,
  (len) => {
    if (len === 0) activeTab.value = '0';
    else if (Number(activeTab.value) > len - 1) activeTab.value = String(len - 1);
  },
);
</script>

<template>
  <CollapseCard v-model:collapsed="collapsed" :title="field.label">
    <div>
      <t-tabs
        :model-value="activeTab"
        theme="card"
        :addable="addable && !isMaxed"
        :drag-sort="!!field.sortable"
        @update:model-value="onTabChange"
        @drag-sort="onDragSort"
        @remove="onRemove"
        @add="addItem"
      >
        <t-tab-panel
          v-for="(item, idx) in items"
          :key="idx"
          :value="String(idx)"
          :label="itemLabel(idx, item)"
          :removable="removable"
        >
          <div class="pt-3">
            <t-textarea
              v-if="useTextarea"
              :model-value="itemValue(idx)"
              :placeholder="field.placeholder"
              clearable
              v-bind="field.props"
              @update:model-value="(v: string) => setItemValue(idx, v)"
            />
            <t-input
              v-else
              :model-value="itemValue(idx)"
              :placeholder="field.placeholder"
              clearable
              v-bind="field.props"
              @update:model-value="(v: string) => setItemValue(idx, v)"
            />
          </div>
        </t-tab-panel>
      </t-tabs>
      <div v-if="!items.length" class="text-center text-gray-400 py-6 text-sm">
        暂无数据，点击右侧添加
      </div>
    </div>
  </CollapseCard>
</template>
