<template>
  <div class="object-field" v-show="!schema['x-hidden']">
    <div v-if="label" class="object-header">
      <t-collapse
        :default-expand-all="defaultExpanded"
        :disabled="!mergedCollapsible"
        :expand-icon-placement="'left'"
      >
        <t-collapse-panel :header="label" :value="path">
          <template #header>
            <div class="object-header-content">
              <span class="object-title">
                <t-icon v-if="schema['x-icon']" :name="schema['x-icon']" class="field-icon" />
                {{ label }}
                <span v-if="required" class="required-mark">*</span>
              </span>
              <span v-if="schema.description && showDescription" class="object-description">
                {{ schema.description }}
              </span>
            </div>
          </template>
          <div class="object-content">
            <template v-for="propName in propertyNames" :key="propName">
              <SchemaField
                :schema="schema.properties![propName]"
                :model-value="getPropertyValue(propName)"
                :path="getPropertyPath(propName)"
                :label="getPropertyLabel(propName)"
                :required="isRequired(propName)"
                :disabled="disabled"
                :readonly="readonly"
                :errors="getPropertyErrors(propName)"
                @update:model-value="updateProperty(propName, $event)"
              />
            </template>
          </div>
        </t-collapse-panel>
      </t-collapse>
    </div>
    <div v-else class="object-content">
      <template v-for="propName in propertyNames" :key="propName">
        <SchemaField
          :schema="schema.properties![propName]"
          :model-value="getPropertyValue(propName)"
          :path="getPropertyPath(propName)"
          :label="getPropertyLabel(propName)"
          :required="isRequired(propName)"
          :disabled="disabled"
          :readonly="readonly"
          :errors="getPropertyErrors(propName)"
          @update:model-value="updateProperty(propName, $event)"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import type { JsonSchema, ValidationError, ThemeConfig } from '../types'
import SchemaField from './SchemaField.vue'

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
  'update:modelValue': [value: Record<string, unknown>]
}>()

const theme = inject<ThemeConfig>('theme', {})

const showDescription = computed(() => theme.showDescription ?? true)

const propertyNames = computed(() => {
  if (!props.schema.properties) return []
  const props_list = Object.keys(props.schema.properties)
  if (props.schema['x-order']) {
    const order = props.schema['x-order']
    props_list.sort((a, b) => {
      const orderA = order[a] ?? 0
      const orderB = order[b] ?? 0
      return orderA - orderB
    })
  }
  return props_list
})

const mergedCollapsible = computed(() => {
  return props.schema['x-collapsible'] ?? theme.collapsible ?? true
})

const defaultExpanded = computed(() => {
  return props.schema['x-collapsed'] === true ? false : (theme.defaultExpanded ?? true)
})

function getPropertyLabel(propName: string): string {
  const propSchema = props.schema.properties?.[propName]
  return propSchema?.title || propName
}

function getPropertyPath(propName: string): string {
  return props.path ? `${props.path}.${propName}` : propName
}

function getPropertyValue(propName: string): unknown {
  const obj = props.modelValue as Record<string, unknown> | undefined
  return obj?.[propName]
}

function isRequired(propName: string): boolean {
  return props.schema.required?.includes(propName) ?? false
}

function getPropertyErrors(propName: string): ValidationError[] | undefined {
  if (!props.errors) return undefined
  const propPath = getPropertyPath(propName)
  return props.errors.filter(e => e.path === propPath || e.path.startsWith(`${propPath}.`))
}

function updateProperty(propName: string, value: unknown) {
  const obj = { ...(props.modelValue as Record<string, unknown> || {}) }
  if (value === undefined) {
    delete obj[propName]
  } else {
    obj[propName] = value
  }
  emit('update:modelValue', obj)
}
</script>

<style scoped>
.object-field {
  margin-bottom: 8px;
}

.object-header {
  margin-bottom: 8px;
}

.object-header-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.object-title {
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.field-icon {
  color: var(--td-brand-color);
}

.required-mark {
  color: var(--td-error-color);
  margin-left: 2px;
}

.object-description {
  color: var(--td-text-color-secondary);
  font-size: 12px;
  font-weight: normal;
}

.object-content {
  padding: 8px 0;
}
</style>
