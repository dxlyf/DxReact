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
    <template v-if="schema.enum && schema.enum.length > 0">
      <t-select
        :value="modelValue as string"
        @update:value="handleChange"
        :placeholder="placeholder"
        :disabled="mergedDisabled"
        :readonly="mergedReadonly"
        :clearable="!required"
        v-bind="schema['x-props']"
      >
        <t-option
          v-for="item in enumOptions"
          :key="String(item.value)"
          :value="item.value as string"
          :label="item.label"
          :disabled="item.disabled"
        />
      </t-select>
    </template>
    <template v-else-if="xFormat === 'textarea'">
      <t-textarea
        :value="modelValue as string"
        @update:value="handleChange"
        :placeholder="placeholder"
        :disabled="mergedDisabled"
        :readonly="mergedReadonly"
        :maxlength="schema.maxLength"
        :autosize="{ minRows: 3, maxRows: 10 }"
        v-bind="schema['x-props']"
      />
    </template>
    <template v-else-if="schema.format === 'date' || xFormat === 'date'">
      <t-date-picker
        :value="modelValue as string"
        @update:value="handleChange"
        :placeholder="placeholder"
        :disabled="mergedDisabled"
        :readonly="mergedReadonly"
        v-bind="schema['x-props']"
      />
    </template>
    <template v-else-if="xFormat === 'datetime'">
      <t-date-picker
        :value="modelValue as string"
        @update:value="handleChange"
        :placeholder="placeholder"
        :disabled="mergedDisabled"
        :readonly="mergedReadonly"
        enable-time-picker
        v-bind="schema['x-props']"
      />
    </template>
    <template v-else-if="xFormat === 'time'">
      <t-time-picker
        :value="modelValue as string"
        @update:value="handleChange"
        :placeholder="placeholder"
        :disabled="mergedDisabled"
        :readonly="mergedReadonly"
        v-bind="schema['x-props']"
      />
    </template>
    <template v-else-if="schema.format === 'email' || xFormat === 'email'">
      <t-input
        :value="modelValue as string"
        @update:value="handleChange"
        :placeholder="placeholder"
        :disabled="mergedDisabled"
        :readonly="mergedReadonly"
        :maxlength="schema.maxLength"
        type="email"
        v-bind="schema['x-props']"
      >
        <template v-if="schema['x-prefix-icon'] || schema['x-prefix']" #prefix>
          <t-icon v-if="schema['x-prefix-icon']" :name="schema['x-prefix-icon']" />
          <span v-else-if="schema['x-prefix']">{{ schema['x-prefix'] }}</span>
        </template>
        <template v-if="schema['x-suffix-icon'] || schema['x-suffix']" #suffix>
          <t-icon v-if="schema['x-suffix-icon']" :name="schema['x-suffix-icon']" />
          <span v-else-if="schema['x-suffix']">{{ schema['x-suffix'] }}</span>
        </template>
      </t-input>
    </template>
    <template v-else-if="schema.format === 'password' || xFormat === 'password'">
      <t-input
        :value="modelValue as string"
        @update:value="handleChange"
        :placeholder="placeholder"
        :disabled="mergedDisabled"
        :readonly="mergedReadonly"
        :maxlength="schema.maxLength"
        type="password"
        v-bind="schema['x-props']"
      >
        <template v-if="schema['x-prefix-icon'] || schema['x-prefix']" #prefix>
          <t-icon v-if="schema['x-prefix-icon']" :name="schema['x-prefix-icon']" />
          <span v-else-if="schema['x-prefix']">{{ schema['x-prefix'] }}</span>
        </template>
      </t-input>
    </template>
    <template v-else-if="schema.format === 'uri' || xFormat === 'url'">
      <t-input
        :value="modelValue as string"
        @update:value="handleChange"
        :placeholder="placeholder"
        :disabled="mergedDisabled"
        :readonly="mergedReadonly"
        :maxlength="schema.maxLength"
        v-bind="schema['x-props']"
      >
        <template v-if="schema['x-prefix-icon'] || schema['x-prefix']" #prefix>
          <t-icon v-if="schema['x-prefix-icon']" :name="schema['x-prefix-icon']" />
          <span v-else-if="schema['x-prefix']">{{ schema['x-prefix'] }}</span>
        </template>
        <template v-if="schema['x-suffix-icon'] || schema['x-suffix']" #suffix>
          <t-icon v-if="schema['x-suffix-icon']" :name="schema['x-suffix-icon']" />
          <span v-else-if="schema['x-suffix']">{{ schema['x-suffix'] }}</span>
        </template>
      </t-input>
    </template>
    <template v-else-if="schema.format === 'color' || xFormat === 'color'">
      <div class="color-field">
        <t-input
          :value="modelValue as string"
          @update:value="handleChange"
          :placeholder="placeholder"
          :disabled="mergedDisabled"
          :readonly="mergedReadonly"
          v-bind="schema['x-props']"
        >
          <template #prefix>
            <div
              class="color-preview"
              :style="{ backgroundColor: modelValue as string || '#ffffff' }"
            />
          </template>
        </t-input>
        <t-color-picker
          :value="modelValue as string"
          @update:value="handleChange"
          :disabled="mergedDisabled"
          :show-primary-color-preview="false"
        />
      </div>
    </template>
    <template v-else-if="xFormat === 'cascader'">
      <t-cascader
        :value="modelValue as string"
        @update:value="handleChange"
        :placeholder="placeholder"
        :disabled="mergedDisabled"
        :options="cascaderOptions"
        v-bind="schema['x-props']"
      />
    </template>
    <template v-else-if="xFormat === 'tree-select'">
      <t-tree-select
        :value="modelValue as string"
        @update:value="handleChange"
        :placeholder="placeholder"
        :disabled="mergedDisabled"
        :data="treeOptions"
        v-bind="schema['x-props']"
      />
    </template>
    <template v-else-if="xFormat === 'radio'">
      <t-radio-group
        :value="modelValue as string"
        @update:value="handleChange"
        :disabled="mergedDisabled"
        v-bind="schema['x-props']"
      >
        <t-radio
          v-for="item in enumOptions"
          :key="String(item.value)"
          :value="item.value as string"
          :disabled="item.disabled"
        >
          {{ item.label }}
        </t-radio>
      </t-radio-group>
    </template>
    <template v-else-if="xFormat === 'upload'">
      <t-upload
        :files="uploadFiles"
        @update:files="handleUploadChange"
        :action="schema['x-upload']?.action || ''"
        :accept="schema['x-upload']?.accept"
        :multiple="schema['x-upload']?.multiple"
        :disabled="mergedDisabled"
        :tips="schema['x-upload']?.tips"
        v-bind="schema['x-props']"
      />
    </template>
    <template v-else-if="xFormat === 'editor'">
      <div class="editor-field" :style="{ height: editorHeight }">
        <t-textarea
          :value="modelValue as string"
          @update:value="handleChange"
          :placeholder="schema['x-editor']?.placeholder || placeholder"
          :disabled="mergedDisabled"
          :readonly="mergedReadonly"
          :autosize="{ minRows: 8, maxRows: 20 }"
          v-bind="schema['x-props']"
        />
      </div>
    </template>
    <template v-else>
      <t-input
        :value="modelValue as string"
        @update:value="handleChange"
        :placeholder="placeholder"
        :disabled="mergedDisabled"
        :readonly="mergedReadonly"
        :maxlength="schema.maxLength"
        v-bind="schema['x-props']"
      >
        <template v-if="schema['x-prefix-icon'] || schema['x-prefix']" #prefix>
          <t-icon v-if="schema['x-prefix-icon']" :name="schema['x-prefix-icon']" />
          <span v-else-if="schema['x-prefix']">{{ schema['x-prefix'] }}</span>
        </template>
        <template v-if="schema['x-suffix-icon'] || schema['x-suffix']" #suffix>
          <t-icon v-if="schema['x-suffix-icon']" :name="schema['x-suffix-icon']" />
          <span v-else-if="schema['x-suffix']">{{ schema['x-suffix'] }}</span>
        </template>
      </t-input>
    </template>
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
  'update:modelValue': [value: string]
}>()

const theme = inject<ThemeConfig>('theme', {})
const xFormat = computed(() => props.schema['x-format'])

const showDescription = computed(() => theme.showDescription ?? true)

const placeholder = computed(() => {
  return props.schema['x-placeholder'] || `请输入${props.label || ''}`
})

const mergedDisabled = computed(() => {
  return props.schema['x-disabled'] ?? props.disabled
})

const mergedReadonly = computed(() => {
  return props.schema['x-readonly'] ?? props.readonly
})

const fieldStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.schema['x-width']) {
    const width = props.schema['x-width']
    style.width = typeof width === 'number' ? `${width}px` : width
  }
  return style
})

const enumOptions = computed(() => {
  if (props.schema['x-enum-options']) {
    return props.schema['x-enum-options']
  }
  if (props.schema.enum) {
    return props.schema.enum.map(item => ({
      label: String(item),
      value: item,
      disabled: false
    }))
  }
  return []
})

const cascaderOptions = computed(() => {
  return props.schema['x-cascader-options'] || []
})

const treeOptions = computed(() => {
  return props.schema['x-tree-options'] || []
})

const editorHeight = computed(() => {
  return props.schema['x-editor']?.height ? `${props.schema['x-editor'].height}px` : 'auto'
})

const uploadFiles = computed(() => {
  const value = props.modelValue
  if (!value) return []
  if (typeof value === 'string') {
    return [{ name: value, url: value, status: 'success' }]
  }
  if (Array.isArray(value)) {
    return value.map((url, index) => ({
      name: `file-${index}`,
      url,
      status: 'success'
    }))
  }
  return []
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

function handleChange(value: string) {
  emit('update:modelValue', value)
}

function handleUploadChange(files: Array<{ url?: string; response?: { url?: string } }>) {
  const urls = files
    .map(f => f.url || f.response?.url)
    .filter(Boolean)
  emit('update:modelValue', urls.join(','))
}
</script>

<style scoped>
.color-field {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-preview {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid var(--td-component-border);
}

.label-tooltip-icon {
  margin-left: 4px;
  color: var(--td-text-color-placeholder);
  cursor: help;
}

.editor-field {
  width: 100%;
}
</style>
