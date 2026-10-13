// ============================================================================
// useFieldLayout：基础字段（string / number / select / textarea / date）的
// 标签与控件排布样式。由顶层 SchemaForm 的 labelLayout prop 驱动。
// ============================================================================

import { computed, inject } from 'vue';
import { SCHEMA_FORM_KEY, type SchemaFormContext } from '../types';

export function useFieldLayout() {
  const ctx = inject<SchemaFormContext>(SCHEMA_FORM_KEY)!;
  const horizontal = computed(() => ctx.labelLayout === 'horizontal');

  return {
    /** 字段外层容器 */
    wrapperClass: computed(() => (horizontal.value ? 'flex items-start mb-3' : 'mb-3')),
    /** 标签 */
    labelClass: computed(() =>
      horizontal.value
        ? 'w-28 shrink-0 text-sm text-gray-700 pt-2 text-right pr-3'
        : 'block text-sm text-gray-700 mb-1',
    ),
    /** 控件容器 */
    controlClass: computed(() => (horizontal.value ? 'flex-1 min-w-0' : '')),
  };
}
