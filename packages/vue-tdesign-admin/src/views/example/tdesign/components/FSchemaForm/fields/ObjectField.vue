<script setup lang="ts">
// ============================================================================
// ObjectField：对象字段
// - 带边框卡片 + 收起/展开
// - 右侧 Popover 管理字段显隐与手输新增
// - 显隐切换时把值在 modelValue 与隐藏值暂存区之间搬运
// ============================================================================
import { computed, defineAsyncComponent, inject, ref } from 'vue';
import CollapseCard from '../components/CollapseCard.vue';
import FieldPopover from '../components/FieldPopover.vue';
import {
  SCHEMA_FORM_KEY,
  type FieldPath,
  type ObjectField,
  type RuntimeAddedField,
  type SchemaFormContext,
} from '../types';
import { getDefaultVisibleKeys } from '../utils/schema';
import { buildFieldDefault } from '../utils/value';

const props = defineProps<{ field: ObjectField; path: FieldPath }>();
const ctx = inject<SchemaFormContext>(SCHEMA_FORM_KEY)!;

// 异步加载顶层 SchemaForm 以打断循环依赖，同时隔离子字段重渲染
const SchemaFormComp = defineAsyncComponent(() => import('../SchemaForm.vue'));

// 收起/展开属于内部 UI state：不进入 value，也不随 schema 变化重置
const collapsed = ref(props.field.defaultCollapsed ?? false);
// 当前可见字段 key，初始由 defaultVisible 决定（未配置则全部可见）
const visibleKeys = ref<string[]>([...getDefaultVisibleKeys(props.field)]);

const togglable = computed(() => props.field.togglable !== false);
const allowAddField = computed(() => props.field.allowAddField !== false);
const visibleFields = computed(() =>
  props.field.fields.filter((f) => visibleKeys.value.includes(f.key)),
);

/** 显示字段：从暂存区取回值，取不到用默认值 */
function showField(key: string) {
  if (visibleKeys.value.includes(key)) return;
  const sub = props.field.fields.find((f) => f.key === key);
  if (!sub) return;
  visibleKeys.value.push(key);
  const childPath: FieldPath = [...props.path, key];
  const stored = ctx.takeHidden(childPath);
  ctx.setValue(childPath, stored !== undefined ? stored : buildFieldDefault(sub));
}

/** 隐藏字段：把值搬入暂存区，并从 modelValue 中删除 */
function hideField(key: string) {
  if (!visibleKeys.value.includes(key)) return;
  visibleKeys.value = visibleKeys.value.filter((k) => k !== key);
  const childPath: FieldPath = [...props.path, key];
  const val = ctx.getValue(childPath);
  if (val !== undefined) ctx.setHidden(childPath, val);
  ctx.removeValue(childPath);
}

function onToggle(key: string, checked: boolean) {
  checked ? showField(key) : hideField(key);
}

function selectAll() {
  props.field.fields.forEach((f) => showField(f.key));
}

function deselectAll() {
  [...visibleKeys.value].forEach((k) => hideField(k));
}

/** 手输新增字段：默认 string、默认可见、触发 schema-change */
function addField(key: string) {
  const newField: RuntimeAddedField = {
    key,
    label: key,
    type: 'string',
    defaultValue: '',
    __runtimeAdded: true,
  };
  props.field.fields.push(newField);
  visibleKeys.value.push(key);
  ctx.setValue([...props.path, key], '');
  ctx.emitSchemaChange();
}

/** 删除运行时新增字段：从 schema 与值中移除，并触发 schema-change */
function removeField(key: string) {
  const idx = props.field.fields.findIndex((f) => f.key === key);
  if (idx === -1) return;
  props.field.fields.splice(idx, 1);
  visibleKeys.value = visibleKeys.value.filter((k) => k !== key);
  ctx.removeValue([...props.path, key]);
  ctx.emitSchemaChange();
}
</script>

<template>
  <CollapseCard v-model:collapsed="collapsed" :title="field.label">
    <template #extra>
      <FieldPopover v-if="togglable" :fields="field.fields" :visible-keys="visibleKeys" :allow-add-field="allowAddField"
        trigger-text="编辑属性" trigger-icon="setting" @toggle="onToggle" @select-all="selectAll"
        @deselect-all="deselectAll" @add="addField" @remove="removeField" />
    </template>
    <SchemaFormComp :schema="visibleFields" :path="path" />
  </CollapseCard>
</template>
