<!--
  WidgetRenderer.vue
  作用：根据 node.type 渲染具体控件（input / number / select / date / textarea）。
  双向绑定：用 computed 的 get/set 读写 ctx.model
  - get：ctx.getValue(path)
  - set：ctx.setValue(path, value)，并在该字段已有错误时立即重新校验，及时消除红框
-->
<script setup lang="ts">
import { computed } from 'vue'
import type { SchemaNode, SelectOption, WidgetType } from './types'
import { useFormContext } from './useFormContext'

const props = withDefaults(
  defineProps<{ node: SchemaNode; path: string; invalid?: boolean }>(),
  { invalid: false },
)

const ctx = useFormContext()

/** 各类型控件的默认占位提示 */
const DEFAULT_PLACEHOLDER: Partial<Record<WidgetType, string>> = {
  input: '请输入',
  number: '请输入数字',
  select: '请选择',
  date: '请选择日期',
  textarea: '请输入',
}

const disabled = computed(() => props.node.disabled === true)
const placeholder = computed(
  () => props.node.placeholder ?? DEFAULT_PLACEHOLDER[props.node.type as WidgetType] ?? '',
)
const options = computed<SelectOption[]>(() => props.node.props?.options ?? [])
const rows = computed(() => (props.node.props?.rows as number | undefined) ?? 3)

/** 写入 model，并在该字段已有错误时立即重新校验 */
function commit(value: unknown): void {
  ctx.setValue(props.path, value)
  if (ctx.getError(props.path)) {
    void ctx.validateField(props.path)
  }
}

/** 文本 / 日期 / 文本域：值统一按字符串处理 */
const textValue = computed<string>({
  get() {
    const value = ctx.getValue(props.path)
    return value === undefined || value === null ? '' : String(value)
  },
  set(value: string) {
    commit(value)
  },
})

/** 数字：读取时转数字，写入时转回 number */
const numberValue = computed<number | string>({
  get() {
    const value = ctx.getValue(props.path)
    if (value === undefined || value === null || value === '') return ''
    const num = Number(value)
    return Number.isNaN(num) ? '' : num
  },
  set(value: number | string) {
    commit(value === '' ? '' : Number(value))
  },
})

/** 下拉框：DOM 的 value 永远是字符串，写回时按 String 匹配原始选项以保留类型 */
const selectValue = computed<string>({
  get() {
    const value = ctx.getValue(props.path)
    return value === undefined || value === null ? '' : String(value)
  },
  set(value: string) {
    const matched = options.value.find((option) => String(option.value) === value)
    commit(matched ? matched.value : value)
  },
})
</script>

<template>
  <input
    v-if="node.type === 'input'"
    v-model="textValue"
    class="sf-control"
    :class="{ 'is-invalid': invalid }"
    type="text"
    :placeholder="placeholder"
    :disabled="disabled"
  />

  <input
    v-else-if="node.type === 'number'"
    v-model.number="numberValue"
    class="sf-control"
    :class="{ 'is-invalid': invalid }"
    type="number"
    :placeholder="placeholder"
    :disabled="disabled"
  />

  <input
    v-else-if="node.type === 'date'"
    v-model="textValue"
    class="sf-control"
    :class="{ 'is-invalid': invalid }"
    type="date"
    :disabled="disabled"
  />

  <textarea
    v-else-if="node.type === 'textarea'"
    v-model="textValue"
    class="sf-control sf-control--textarea"
    :class="{ 'is-invalid': invalid }"
    :rows="rows"
    :placeholder="placeholder"
    :disabled="disabled"
  />

  <select
    v-else-if="node.type === 'select'"
    v-model="selectValue"
    class="sf-control sf-control--select"
    :class="{ 'is-invalid': invalid }"
    :disabled="disabled"
  >
    <option value="">{{ placeholder }}</option>
    <option
      v-for="option in options"
      :key="String(option.value)"
      :value="String(option.value)"
      :disabled="option.disabled"
    >
      {{ option.label }}
    </option>
  </select>

  <span v-else class="sf-control sf-control--unknown">不支持的控件类型：{{ node.type }}</span>
</template>

<style scoped>
.sf-control {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 6px 10px;
  font-size: 13px;
  line-height: 1.5;
  color: #1f2937;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.sf-control:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.sf-control:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

/* 校验失败：边框变红 */
.sf-control.is-invalid {
  border-color: #ef4444;
}

.sf-control.is-invalid:focus {
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.15);
}

.sf-control--textarea {
  resize: vertical;
}

.sf-control--select {
  cursor: pointer;
}

.sf-control--unknown {
  color: #9ca3af;
  border-style: dashed;
}
</style>
