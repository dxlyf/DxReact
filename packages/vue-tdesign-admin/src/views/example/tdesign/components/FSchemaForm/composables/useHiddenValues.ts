// ============================================================================
// useHiddenValues：隐藏值暂存区（受控 / 非受控二选一）
// ============================================================================

import { computed, ref } from 'vue';
import type { FieldPath, HiddenValues, SchemaFormEmits, SchemaFormProps } from '../types';
import { deepClone, deleteByPath, getByPath, setByPath } from '../utils/value';

export function useHiddenValues(props: SchemaFormProps, emit: SchemaFormEmits) {
  // 非受控模式下的内部存储
  const inner = ref<HiddenValues>({});

  // 受控优先：外部传入 hiddenValues 时以 props 为准
  const isControlled = computed(() => props.hiddenValues !== undefined);
  const store = computed<HiddenValues>(() =>
    isControlled.value ? (props.hiddenValues as HiddenValues) : inner.value,
  );

  /** 提交新的暂存区：受控则回传，非受控则更新内部 ref */
  function commit(next: HiddenValues) {
    if (isControlled.value) emit('update:hiddenValues', next);
    else inner.value = next;
  }

  function getHidden(path: FieldPath): any {
    return getByPath(store.value, path);
  }

  function setHidden(path: FieldPath, val: any) {
    const next = deepClone(store.value);
    setByPath(next, path, val);
    commit(next);
  }

  function deleteHidden(path: FieldPath) {
    const next = deepClone(store.value);
    deleteByPath(next, path);
    commit(next);
  }

  /** 取出并删除（取值同时清除暂存） */
  function takeHidden(path: FieldPath): any {
    const val = getByPath(store.value, path);
    if (val !== undefined) deleteHidden(path);
    return val;
  }

  /** 批量合并（用于初始化剥离、多处一次提交） */
  function mergeHidden(values: HiddenValues) {
    if (!values || Object.keys(values).length === 0) return;
    const next = deepClone(store.value);
    Object.assign(next, deepClone(values));
    commit(next);
  }

  return { store, isControlled, getHidden, setHidden, deleteHidden, takeHidden, mergeHidden };
}
