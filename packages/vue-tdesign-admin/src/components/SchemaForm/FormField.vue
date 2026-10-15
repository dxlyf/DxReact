<!--
  FormField.vue
  作用：单个 Schema 节点的渲染单元。
  - 计算完整路径 fullPath，并根据 visible 决定是否渲染
  - 容器节点（card / group / grid）渲染布局后递归调用 <FormRenderer>
  - list 节点渲染动态数组，支持添加 / 删除，项内用 itemSchema 递归渲染（可无限嵌套）
  - 普通字段渲染 label、控件与错误信息
-->
<script setup lang="ts">
import { computed } from 'vue'
import type { SchemaNode } from './types'
import {
  createListItem,
  evaluateVisible,
  useFormContext,
} from './useFormContext'
import FormRenderer from './FormRenderer.vue'
import WidgetRenderer from './WidgetRenderer.vue'

const props = defineProps<{ node: SchemaNode; path: string }>()

const ctx = useFormContext()

/** 完整数据路径：父路径 + 当前节点 key（容器上的 key 同样参与拼接，用于嵌套对象） */
const fullPath = computed(() =>
  props.node.key ? (props.path ? `${props.path}.${props.node.key}` : props.node.key) : props.path,
)

/** 条件显隐：仅控制渲染，不影响数据 */
const visible = computed(() => evaluateVisible(props.node.visible, ctx.model))

/** 栅格占位：默认整行（24），节点可通过 span 覆盖 */
const span = computed(() => props.node.span ?? 24)

const isRequired = computed(() => (props.node.rules ?? []).some((rule) => rule.required))

const error = computed(() => ctx.errors[fullPath.value])
const invalid = computed(() => Boolean(error.value))

/** 列表数据（保持与 model 中数组的引用一致，便于直接增删） */
const listValue = computed<unknown[]>(() => {
  const value = ctx.getValue(fullPath.value)
  return Array.isArray(value) ? value : []
})

const reachedMax = computed(
  () => props.node.maxItems !== undefined && listValue.value.length >= props.node.maxItems,
)
const reachedMin = computed(
  () => props.node.minItems !== undefined && listValue.value.length <= props.node.minItems,
)

/** 确保列表数据存在并返回可写数组引用 */
function ensureList(): unknown[] | undefined {
  const current = ctx.getValue(fullPath.value)
  if (Array.isArray(current)) return current
  // 无 key 的列表节点没有独立数据路径，无法写入
  if (!props.node.key) return undefined
  const next: unknown[] = []
  ctx.setValue(fullPath.value, next)
  return next
}

/** 添加一项：按 itemSchema 初始化默认值 */
function handleAdd(): void {
  if (reachedMax.value) return
  ensureList()?.push(createListItem(props.node.itemSchema))
}

/** 删除一项 */
function handleRemove(index: number): void {
  if (reachedMin.value) return
  ensureList()?.splice(index, 1)
}

/** 列表项路径：contacts.0 */
const getItemPath = (index: number): string =>
  fullPath.value ? `${fullPath.value}.${index}` : `${index}`
</script>

<template>
  <div v-if="visible" class="sf-field" :style="{ gridColumn: `span ${span}` }">
    <!-- card 卡片容器 -->
    <section v-if="node.type === 'card'" class="sf-card">
      <header v-if="node.title || node.label" class="sf-card__header">
        {{ node.title || node.label }}
      </header>
      <div class="sf-card__body">
        <FormRenderer :schema="node.children || []" :path="fullPath" />
      </div>
    </section>

    <!-- group / grid 栅格容器 -->
    <div v-else-if="node.type === 'group' || node.type === 'grid'" class="sf-group">
      <FormRenderer :schema="node.children || []" :path="fullPath" />
    </div>

    <!-- list 动态列表（itemSchema 内可再次出现 list，实现无限嵌套） -->
    <section v-else-if="node.type === 'list'" class="sf-list">
      <header class="sf-list__header">
        <span class="sf-list__title">{{ node.title || node.label || '列表' }}</span>
        <button
          type="button"
          class="sf-btn sf-btn--primary"
          :disabled="reachedMax"
          @click="handleAdd"
        >
          {{ node.addText || '添加一项' }}
        </button>
      </header>

      <p v-if="listValue.length === 0" class="sf-list__empty">暂无数据</p>

      <div v-for="(_item, index) in listValue" :key="index" class="sf-list__item">
        <div class="sf-list__item-header">
          <span class="sf-list__index">#{{ index + 1 }}</span>
          <button
            type="button"
            class="sf-btn sf-btn--danger"
            :disabled="reachedMin"
            @click="handleRemove(index)"
          >
            删除
          </button>
        </div>
        <FormRenderer :schema="node.itemSchema || []" :path="getItemPath(index)" />
      </div>
    </section>

    <!-- 普通字段 -->
    <div v-else class="sf-form-item">
      <label class="sf-form-item__label">
        {{ node.label }}<span v-if="isRequired" class="sf-form-item__required">*</span>
      </label>
      <div class="sf-form-item__control">
        <WidgetRenderer :node="node" :path="fullPath" :invalid="invalid" />
        <p v-if="error" class="sf-form-item__error">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sf-field {
  min-width: 0;
}

/* 卡片 */
.sf-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}

.sf-card__header {
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.sf-card__body {
  padding: 16px;
}

/* 分组 */
.sf-group {
  padding: 16px;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
}

/* 列表 */
.sf-list {
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.sf-list__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.sf-list__title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.sf-list__empty {
  margin: 0;
  padding: 12px 0;
  font-size: 13px;
  color: #9ca3af;
  text-align: center;
}

.sf-list__item {
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #eef2f7;
  border-radius: 6px;
  background: #fcfdff;
}

.sf-list__item:last-child {
  margin-bottom: 0;
}

.sf-list__item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.sf-list__index {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

/* 表单字段 */
.sf-form-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.sf-form-item__label {
  flex: 0 0 92px;
  padding-top: 8px;
  font-size: 13px;
  color: #374151;
  text-align: right;
  word-break: break-all;
}

.sf-form-item__required {
  margin-left: 2px;
  color: #ef4444;
}

.sf-form-item__control {
  flex: 1 1 auto;
  min-width: 0;
}

.sf-form-item__error {
  margin: 4px 0 0;
  font-size: 12px;
  color: #ef4444;
}

/* 按钮 */
.sf-btn {
  padding: 4px 10px;
  font-size: 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  color: #374151;
  cursor: pointer;
}

.sf-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sf-btn--primary {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}

.sf-btn--danger {
  border-color: #fca5a5;
  color: #dc2626;
}
</style>
