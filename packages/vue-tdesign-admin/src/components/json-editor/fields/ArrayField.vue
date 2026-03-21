<template>
  <t-form-item
    v-show="!schema['x-hidden']"
    :label="label"
    :name="path"
    :required="required"
    :help="showDescription ? schema.description : undefined"
    :status="errorStatus"
    :tips="errorMessage"
    :style="fieldStyle"
  >
    <div class="array-field">
      <div class="array-items">
        <div
          v-for="(item, index) in items"
          :key="index"
          class="array-item"
        >
          <div class="array-item-index">{{ index + 1 }}</div>
          <div class="array-item-content">
            <SchemaField
              :schema="itemSchema"
              :model-value="item"
              :path="getItemPath(index)"
              :disabled="disabled"
              :readonly="readonly"
              :errors="getItemErrors(index)"
              @update:model-value="updateItem(index, $event)"
            />
          </div>
          <div class="array-item-actions">
            <t-button
              variant="text"
              shape="circle"
              :disabled="mergedDisabled || readonly"
              @click="moveUp(index)"
            >
              <template #icon>
                <t-icon name="chevron-up" />
              </template>
            </t-button>
            <t-button
              variant="text"
              shape="circle"
              :disabled="mergedDisabled || readonly"
              @click="moveDown(index)"
            >
              <template #icon>
                <t-icon name="chevron-down" />
              </template>
            </t-button>
            <t-popconfirm
              content="确定要删除此项吗？"
              @confirm="removeItem(index)"
            >
              <t-button
                variant="text"
                shape="circle"
                theme="danger"
                :disabled="mergedDisabled || readonly"
              >
                <template #icon>
                  <t-icon name="delete" />
                </template>
              </t-button>
            </t-popconfirm>
          </div>
        </div>
      </div>
      <div class="array-actions">
        <t-button
          variant="dashed"
          :disabled="mergedDisabled || readonly || maxItemsReached"
          @click="addItem"
          v-bind="schema['x-props']"
        >
          <template #icon>
            <t-icon name="add" />
          </template>
          添加
        </t-button>
        <span v-if="schema.minItems || schema.maxItems" class="array-hint">
          {{ items.length }} / {{ schema.maxItems || '∞' }}
          <template v-if="schema.minItems">
            (最少 {{ schema.minItems }} 项)
          </template>
        </span>
      </div>
    </div>
    <template v-if="schema['x-tooltip']" #label>
      <span>{{ label }}</span>
      <t-tooltip :content="schema['x-tooltip']" placement="top">
        <t-icon name="help-circle" class="label-tooltip-icon" />
      </t-tooltip>
    </template>
  </t-form-item>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import type { JsonSchema, ValidationError, ThemeConfig } from '../types'
import SchemaField from './SchemaField.vue'
import { getDefaultValue } from '../utils'

interface Props {
  schema: JsonSchema
  modelValue: unknown
  path: string
  label?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  errors?: ValidationError[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: unknown[]]
}>()

const theme = inject<ThemeConfig>('theme', {})

const showDescription = computed(() => theme.showDescription ?? true)

const items = computed(() => {
  const value = props.modelValue
  return Array.isArray(value) ? value : []
})

const itemSchema = computed(() => {
  return props.schema.items || { type: 'string' }
})

const maxItemsReached = computed(() => {
  if (props.schema.maxItems === undefined) return false
  return items.value.length >= props.schema.maxItems
})

const mergedDisabled = computed(() => {
  return props.schema['x-disabled'] ?? props.disabled
})

const fieldStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.schema['x-width']) {
    const width = props.schema['x-width']
    style.width = typeof width === 'number' ? `${width}px` : width
  }
  return style
})

const errorStatus = computed(() => {
  if (props.errors && props.errors.length > 0) {
    return 'error'
  }
  return undefined
})

const errorMessage = computed(() => {
  if (props.errors && props.errors.length > 0) {
    return props.errors.map(e => e.message).join('、')
  }
  return undefined
})

function getItemPath(index: number): string {
  return `${props.path}[${index}]`
}

function getItemErrors(index: number): ValidationError[] | undefined {
  if (!props.errors) return undefined
  const itemPath = getItemPath(index)
  return props.errors.filter(e => e.path === itemPath || e.path.startsWith(`${itemPath}.`))
}

function addItem() {
  const newItems = [...items.value]
  const defaultValue = getDefaultValue(itemSchema.value)
  newItems.push(defaultValue)
  emit('update:modelValue', newItems)
}

function updateItem(index: number, value: unknown) {
  const newItems = [...items.value]
  newItems[index] = value
  emit('update:modelValue', newItems)
}

function removeItem(index: number) {
  const newItems = [...items.value]
  newItems.splice(index, 1)
  emit('update:modelValue', newItems)
}

function moveUp(index: number) {
  if (index === 0) return
  const newItems = [...items.value]
  ;[newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]]
  emit('update:modelValue', newItems)
}

function moveDown(index: number) {
  if (index === items.value.length - 1) return
  const newItems = [...items.value]
  ;[newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]]
  emit('update:modelValue', newItems)
}
</script>

<style scoped>
.array-field {
  width: 100%;
}

.array-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.array-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-default);
}

.array-item-index {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  background: var(--td-brand-color-light);
  color: var(--td-brand-color);
  border-radius: 50%;
  font-size: 12px;
  font-weight: 500;
}

.array-item-content {
  flex: 1;
  min-width: 0;
}

.array-item-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.array-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.array-hint {
  color: var(--td-text-color-secondary);
  font-size: 12px;
}

.label-tooltip-icon {
  margin-left: 4px;
  color: var(--td-text-color-placeholder);
  cursor: help;
}
</style>
