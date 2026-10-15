<script setup lang="ts">
// ============================================================================
// ArrayField：数组字段
// - 带边框卡片 + 收起/展开 + 项数统计 + 「添加项」
// - 内容区以 Tabs 展示每一项（每项是一个固定结构的 object 表单）
// - 支持拖拽排序（t-tabs 内置 dragSort）与移除二次确认（DialogPlugin.confirm）
// ============================================================================
import { DialogPlugin } from 'tdesign-vue-next';
import { computed, defineAsyncComponent, inject, ref, watch } from 'vue';
import CollapseCard from '../components/CollapseCard.vue';
import FieldPopover from '../components/FieldPopover.vue';
import {
  SCHEMA_FORM_KEY,
  type ArrayField,
  type FieldPath,
  type FieldSchema,
  type RuntimeAddedField,
  type SchemaFormContext,
} from '../types';
import { buildFieldDefault, buildFieldsDefault } from '../utils/value';

const props = defineProps<{ field: ArrayField; path: FieldPath }>();
const ctx = inject<SchemaFormContext>(SCHEMA_FORM_KEY)!;

const SchemaFormComp = defineAsyncComponent(() => import('../SchemaForm.vue'));

// 收起/展开属于内部 UI state，不进入 value
const collapsed = ref(props.field.defaultCollapsed ?? false);

// 数组值即 tab 顺序，位置索引即语义索引
const items = computed<any[]>(() => {
  const v = ctx.getValue(props.path);
  return Array.isArray(v) ? v : [];
});

const activeTab = ref('0');
const removable = computed(() => props.field.removable !== false);
const isMaxed = computed(
  () => props.field.maxItems != null && items.value.length >= props.field.maxItems,
);

function itemLabel(index: number, item: any): string {
  return props.field.getItemLabel ? props.field.getItemLabel(index, item) : `项 ${index + 1}`;
}

// ------------------------ 每项独立的字段显隐（编辑属性） ------------------------
const allItemKeys = computed(() => props.field.itemFields.map((f) => f.key));
const activeIndex = computed(() => Number(activeTab.value));
// 可见字段 key 集合，key = 项索引；缺省 = 全部可见
const visibleKeysMap = ref<Record<number, string[]>>({});

function getVisibleKeys(index: number): string[] {
  return visibleKeysMap.value[index] ?? allItemKeys.value;
}
function setVisibleKeys(index: number, keys: string[]) {
  visibleKeysMap.value = { ...visibleKeysMap.value, [index]: keys };
}

// 当前激活项的可见字段，供 Popover 展示与勾选状态
const activeVisibleKeys = computed(() => getVisibleKeys(activeIndex.value));

/** 当前项实际渲染的字段（按可见集合过滤，保持 itemFields 原顺序） */
function visibleItemFields(index: number): FieldSchema[] {
  const keys = getVisibleKeys(index);
  return props.field.itemFields.filter((f) => keys.includes(f.key));
}

/** 显示某项的某字段：从暂存区取回值，取不到用默认值 */
function showItemField(index: number, key: string) {
  const sub = props.field.itemFields.find((f) => f.key === key);
  if (!sub) return;
  const childPath: FieldPath = [...props.path, index, key];
  const stored = ctx.takeHidden(childPath);
  ctx.setValue(childPath, stored !== undefined ? stored : buildFieldDefault(sub));
}

/** 隐藏某项的某字段：把值搬入暂存区，并从 modelValue 中删除 */
function hideItemField(index: number, key: string) {
  const childPath: FieldPath = [...props.path, index, key];
  const val = ctx.getValue(childPath);
  if (val !== undefined) ctx.setHidden(childPath, val);
  ctx.removeValue(childPath);
}

function onToggle(key: string, checked: boolean) {
  const index = activeIndex.value;
  const keys = new Set(getVisibleKeys(index));
  if (checked) {
    keys.add(key);
    showItemField(index, key);
  } else {
    keys.delete(key);
    hideItemField(index, key);
  }
  setVisibleKeys(index, [...keys]);
}

function selectAll() {
  const index = activeIndex.value;
  const keys = getVisibleKeys(index);
  props.field.itemFields.forEach((f) => {
    if (!keys.includes(f.key)) showItemField(index, f.key);
  });
  setVisibleKeys(index, [...allItemKeys.value]);
}

function deselectAll() {
  const index = activeIndex.value;
  [...getVisibleKeys(index)].forEach((k) => hideItemField(index, k));
  setVisibleKeys(index, []);
}

/**
 * 手输新增字段：默认 string。
 * itemFields 为所有项共享，而显隐「每项独立」——此处保持该语义：
 * 先把各已存在项的可见集合物化为新增前的状态，避免新字段「顺带」出现在其它项，
 * 仅当前激活项可见并初始化值。
 */
function addItemField(key: string) {
  const prevKeys = [...allItemKeys.value];
  const index = activeIndex.value;
  const nextMap: Record<number, string[]> = {};
  items.value.forEach((_, i) => {
    nextMap[i] = i === index ? [...getVisibleKeys(i), key] : (visibleKeysMap.value[i] ?? prevKeys);
  });

  const newField: RuntimeAddedField = {
    key,
    label: key,
    type: 'string',
    defaultValue: '',
    __runtimeAdded: true,
  };
  props.field.itemFields.push(newField);
  visibleKeysMap.value = nextMap;
  ctx.setValue([...props.path, index, key], '');
  ctx.emitSchemaChange();
}

/**
 * 删除运行时新增字段：itemFields 为所有项共享，故从所有项的值中移除该字段，
 * 并从各已物化的可见集合中剔除，最后触发 schema-change。
 */
function removeItemField(key: string) {
  const idx = props.field.itemFields.findIndex((f) => f.key === key);
  if (idx === -1) return;
  props.field.itemFields.splice(idx, 1);
  const nextMap: Record<number, string[]> = {};
  Object.keys(visibleKeysMap.value).forEach((k) => {
    const i = Number(k);
    nextMap[i] = visibleKeysMap.value[i].filter((kk) => kk !== key);
  });
  visibleKeysMap.value = nextMap;
  items.value.forEach((_, i) => ctx.removeValue([...props.path, i, key]));
  ctx.emitSchemaChange();
}

/** 删除项后，同步可见字段集合的索引（删除位之后整体前移） */
function reindexVisibleKeys(removeIndex: number) {
  const next: Record<number, string[]> = {};
  Object.keys(visibleKeysMap.value).forEach((k) => {
    const i = Number(k);
    if (i === removeIndex) return;
    next[i > removeIndex ? i - 1 : i] = visibleKeysMap.value[i];
  });
  visibleKeysMap.value = next;
}

/** 拖拽排序后，同步可见字段集合的索引（区间内整体平移） */
function moveVisibleKeys(from: number, to: number) {
  if (from === to) return;
  const next: Record<number, string[]> = {};
  Object.keys(visibleKeysMap.value).forEach((k) => {
    const i = Number(k);
    let ni = i;
    if (i === from) ni = to;
    else if (from < to && i > from && i <= to) ni = i - 1;
    else if (from > to && i >= to && i < from) ni = i + 1;
    next[ni] = visibleKeysMap.value[i];
  });
  visibleKeysMap.value = next;
}

/** 添加项：新项初始化为 itemFields 的默认值 */
function addItem() {
  if (isMaxed.value) return;
  const item = buildFieldsDefault(props.field.itemFields);
  const next = [...items.value, item];
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
      // TODO: 删除中间项会导致后续索引偏移，隐藏值暂存区中以索引为 key 的路径会失配，
      // 第一版接受该限制。
      const next = items.value.filter((_, i) => i !== index);
      ctx.setValue(props.path, next);
      reindexVisibleKeys(index);
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
// 拖拽由 t-tabs 自行处理 DOM，松手后触发 onDragSort；
// 这里只按索引重排数据，标签与内容都由 items 派生，顺序天然保持一致。
function onDragSort({ currentIndex, targetIndex }: { currentIndex: number; targetIndex: number }) {
  if (currentIndex === targetIndex) return;
  const next = [...items.value];
  const [moved] = next.splice(currentIndex, 1);
  next.splice(targetIndex, 0, moved);
  ctx.setValue(props.path, next);
  moveVisibleKeys(currentIndex, targetIndex);
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
    <template #extra>
      <!-- 编辑属性：管理「当前激活项」的可见字段（每项独立），并支持手输新增字段 -->
      <FieldPopover
        v-if="items.length"
        :fields="field.itemFields"
        :visible-keys="activeVisibleKeys"
        trigger-text="编辑属性"
        trigger-icon="setting"
        @toggle="onToggle"
        @select-all="selectAll"
        @deselect-all="deselectAll"
        @add="addItemField"
        @remove="removeItemField"
      />
    </template>

    <div>
      <t-tabs
        :model-value="activeTab"
        theme="card"
        addable
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
            <SchemaFormComp :schema="visibleItemFields(idx)" :path="[...path, idx]" />
          </div>
        </t-tab-panel>
      </t-tabs>
      <div v-if="!items.length" class="text-center text-gray-400 py-6 text-sm">
        暂无数据，点击右侧添加
      </div>
    </div>
  </CollapseCard>
</template>
