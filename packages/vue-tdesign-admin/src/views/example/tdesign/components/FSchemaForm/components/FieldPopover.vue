<script setup lang="ts">
// ============================================================================
// FieldPopover：通用字段管理 Popover（手输新增 + 勾选显隐 + 全选/全不选/关闭）
// 触发按钮点击后在按钮正上方弹出
// ============================================================================
import { onBeforeUnmount, ref, watch } from 'vue';
import type { FieldSchema, RuntimeAddedField } from '../types';

interface Props {
  /** 全部字段（含隐藏中的字段），用于列表与查重 */
  fields: FieldSchema[];
  /** 当前可见的字段 key */
  visibleKeys: string[];
  /** 是否允许手输新增字段，默认 true */
  allowAddField?: boolean;
  /** 触发按钮文案，默认「添加字段」 */
  triggerText?: string;
  /** 触发按钮图标名，默认「add」 */
  triggerIcon?: string;
}
const props = withDefaults(defineProps<Props>(), {
  allowAddField: true,
  triggerText: '添加字段',
  triggerIcon: 'add',
});

const emit = defineEmits<{
  (e: 'toggle', key: string, checked: boolean): void;
  (e: 'selectAll'): void;
  (e: 'deselectAll'): void;
  (e: 'add', key: string): void;
  (e: 'remove', key: string): void;
}>();

const visible = ref(false);
const inputVal = ref('');
const error = ref('');
const inputRef = ref<any>(null);

/** 仅「运行时手输新增」的字段可删除；schema 预设字段不可删除 */
function isRemovable(f: FieldSchema): boolean {
  return (f as RuntimeAddedField).__runtimeAdded === true;
}

/** 新增字段：校验非空、trim 后非空、且不与已有 key 重复（含隐藏中的字段） */
function submitAdd() {
  const key = inputVal.value.trim();
  if (!key) {
    error.value = '字段名不能为空';
    return;
  }
  if (props.fields.some((f) => f.key === key)) {
    error.value = '字段名已存在';
    return;
  }
  error.value = '';
  emit('add', key);
  inputVal.value = '';
  // 保持焦点，便于连续添加
  inputRef.value?.focus?.();
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') visible.value = false;
}

watch(visible, (v) => {
  if (v) document.addEventListener('keydown', onKeydown);
  else {
    document.removeEventListener('keydown', onKeydown);
    error.value = '';
  }
});
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown));
</script>

<template>
  <t-popup
    v-model:visible="visible"
    trigger="click"
    placement="bottom"
    :destroy-on-close="false"
    overlay-inner-class-name="!p-0"
  >
    <t-button size="small" theme="primary">
      <template #icon><t-icon :name="triggerIcon" /></template>
      {{ triggerText }}
    </t-button>

    <template #content>
      <div class="w-[240px] p-3">
     

        <!-- 3. 已存字段列表 -->
        <div class="max-h-[200px] overflow-auto">
          <div
            v-for="f in fields"
            :key="f.key"
            class="flex items-center py-1 gap-2"
          >
            <t-checkbox
              :checked="visibleKeys.includes(f.key)"
              @change="(v: boolean) => emit('toggle', f.key, v)"
            />
            <span class="flex-1 text-sm text-gray-700 truncate">{{ f.label || f.key }}</span>
            <t-button
              v-if="isRemovable(f)"
              size="small"
              variant="text"
              theme="danger"
              @click="emit('remove', f.key)"
            >
              <template #icon><t-icon name="delete" /></template>
            </t-button>
          </div>
          <div v-if="fields.length === 0" class="text-xs text-gray-400 text-center py-2">
            暂无字段
          </div>
        </div>

        <!-- 4. 底部操作条 -->
        <!-- <div class="border-t border-solid border-gray-200 mt-2 pt-2 flex items-center">
          <t-button size="small" variant="text" @click="emit('selectAll')">全选</t-button>
          <t-button size="small" variant="text" @click="emit('deselectAll')">全不选</t-button>
          <div class="flex-1"></div>
          <t-button size="small" variant="text" @click="visible = false">关闭</t-button>
        </div> -->

           <!-- 1. 手输新增区 -->
        <div v-if="allowAddField">
           <!-- 2. 分隔线 -->
          <div class="border-t border-solid border-gray-200 my-2"></div>
          <div class="flex items-center gap-2">
            <t-input
              ref="inputRef"
              v-model="inputVal"
              size="small"
              placeholder="输入字段名"
              @enter="submitAdd"
            />
            <t-button size="small" theme="primary" @click="submitAdd">添加</t-button>
          </div>
          <div v-if="error" class="text-xs text-red-500 mt-1">{{ error }}</div>
         
        </div>
      </div>
    </template>
  </t-popup>
</template>
