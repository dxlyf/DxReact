// ============================================================================
// useSchemaForm：表单值的读写、默认值初始化、向上冒泡提交
// 仅在顶层 SchemaForm 实例中调用一次，产物通过 provide 共享给嵌套子组件
// ============================================================================

import { isEqual } from 'lodash-es';
import { onMounted, ref, watch } from 'vue';
import type {
  FieldPath,
  FieldSchema,
  HiddenValues,
  SchemaFormContext,
  SchemaFormEmits,
  SchemaFormProps,
} from '../types';
import { applyDefaults, stripHiddenByDefault } from '../utils/schema';
import { deepClone, deleteByPath, getByPath, pathToKey, setByPath } from '../utils/value';
import { useHiddenValues } from './useHiddenValues';

export function useSchemaForm(
  props: SchemaFormProps,
  emit: SchemaFormEmits,
  getSchema: () => FieldSchema[],
) {
  const hidden = useHiddenValues(props, emit);
  const formValue = ref<Record<string, any>>({});

  /**
   * 归一化外部传入的值：深拷贝 -> 补默认值 -> 按默认显隐剥离隐藏字段。
   * 返回被剥离出来的隐藏值（供批量写入暂存区）。
   */
  function normalize(input: Record<string, any>): HiddenValues {
    const schema = getSchema();
    const value = deepClone(input ?? {});
    applyDefaults(schema, value);

    const collected: HiddenValues = {};
    stripHiddenByDefault(schema, value, [], (path: FieldPath, val: any) => {
      collected[pathToKey(path)] = val;
    });
    formValue.value = value;
    return collected;
  }

  /** 向上冒泡完整表单值 */
  function commit() {
    emit('update:modelValue', deepClone(formValue.value));
  }

  // 初始化：可能产生一次剥离，延迟到 mounted 再提交，避免在 setup 阶段冒泡
  const initHidden = normalize(props.modelValue);

  onMounted(() => {
    // 首次挂载若发现 modelValue 含隐藏字段值（或被补默认值），提交一次
    if (!isEqual(formValue.value, props.modelValue)) commit();
    if (Object.keys(initHidden).length > 0) hidden.mergeHidden(initHidden);
  });

  // 外部值变化时同步（用深比较守卫，避免自身 emit 造成的回环）
  watch(
    () => props.modelValue,
    (val) => {
      if (isEqual(val, formValue.value)) return;
      const collected = normalize(val);
      if (Object.keys(collected).length > 0) hidden.mergeHidden(collected);
    },
    { deep: true },
  );

  // 供所有子组件共享的上下文
  const ctx: SchemaFormContext = {
    getValue: (path) => getByPath(formValue.value, path),
    setValue: (path, val) => {
      setByPath(formValue.value, path, val);
      commit();
    },
    removeValue: (path) => {
      deleteByPath(formValue.value, path);
      commit();
    },
    getHidden: (path) => hidden.getHidden(path),
    setHidden: (path, val) => hidden.setHidden(path, val),
    deleteHidden: (path) => hidden.deleteHidden(path),
    takeHidden: (path) => hidden.takeHidden(path),
    mergeHidden: (values) => hidden.mergeHidden(values),
    emitSchemaChange: () => emit('schema-change', deepClone(getSchema())),
    // 用 getter 保持对 props 的响应式追踪（顶层可动态切换布局）
    get labelLayout() {
      return props.labelLayout ?? 'vertical';
    },
  };

  return { formValue, ctx };
}
