<template>
  <div class="json-editor">
    <t-form
      ref="formRef"
      :data="formData"
      :label-align="themeConfig.labelAlign"
      :label-width="themeConfig.labelWidth"
      :disabled="disabled"
      @submit="handleSubmit"
    >
      <div class="json-editor-header" v-if="schema.title">
        <h3 class="json-editor-title">{{ schema.title }}</h3>
        <p class="json-editor-description" v-if="schema.description">
          {{ schema.description }}
        </p>
      </div>

      <div class="json-editor-content">
        <SchemaField
          :schema="schema"
          :model-value="formData"
          :path="''"
          :disabled="disabled"
          :readonly="readonly"
          :errors="validationErrors"
          @update:model-value="handleValueChange"
        />
      </div>

      <div class="json-editor-footer" v-if="showActions">
        <t-button
          theme="primary"
          type="submit"
          :loading="submitting"
          :disabled="disabled"
        >
          提交
        </t-button>
        <t-button
          theme="default"
          variant="base"
          :disabled="disabled"
          @click="handleReset"
        >
          重置
        </t-button>
        <t-button
          theme="default"
          variant="outline"
          :disabled="disabled"
          @click="handleValidate"
        >
          验证
        </t-button>
      </div>
    </t-form>

    <div class="json-editor-preview" v-if="showPreview">
      <div class="preview-header">
        <span class="preview-title">JSON 预览</span>
        <t-button
          variant="text"
          size="small"
          @click="copyToClipboard"
        >
          <template #icon>
            <t-icon name="file-copy" />
          </template>
          复制
        </t-button>
      </div>
      <pre class="preview-content">{{ formattedJson }}</pre>
    </div>

    <div class="json-editor-errors" v-if="showValidation && validationErrors.length > 0">
      <div class="errors-header">
        <t-icon name="error-circle" class="errors-icon" />
        <span>验证错误 ({{ validationErrors.length }})</span>
      </div>
      <ul class="errors-list">
        <li v-for="(error, index) in validationErrors" :key="index">
          <span class="error-path">{{ error.path || '根节点' }}:</span>
          <span class="error-message">{{ error.message }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, provide } from 'vue'
import type { FormInstanceFunctions } from 'tdesign-vue-next'
import type { JsonSchema, ValidationError, ThemeConfig } from './types'
import SchemaField from './fields/SchemaField.vue'
import { validateSchema, getDefaultValue } from './utils'
import { Theme } from './theme'
import { MessagePlugin } from 'tdesign-vue-next'

interface Props {
  schema: JsonSchema
  modelValue?: Record<string, unknown>
  theme?: Theme | ThemeConfig
  disabled?: boolean
  readonly?: boolean
  validateOnChange?: boolean
  showPreview?: boolean
  showActions?: boolean
  showValidation?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  disabled: false,
  readonly: false,
  validateOnChange: true,
  showPreview: false,
  showActions: true,
  showValidation: true
})

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
  'submit': [value: Record<string, unknown>]
  'validate': [errors: ValidationError[], value: Record<string, unknown>]
  'reset': []
}>()

const formRef = ref<FormInstanceFunctions>()
const submitting = ref(false)
const validationErrors = ref<ValidationError[]>([])

const themeInstance = computed(() => {
  if (props.theme instanceof Theme) {
    return props.theme
  }
  return new Theme(props.theme)
})

const themeConfig = computed(() => themeInstance.value.getConfig())

provide<ThemeConfig>('theme', themeConfig.value)

const formData = ref<Record<string, unknown>>({ ...props.modelValue })

watch(
  () => props.modelValue,
  (newValue) => {
    formData.value = { ...newValue }
  },
  { deep: true }
)

const formattedJson = computed(() => {
  return JSON.stringify(formData.value, null, 2)
})

function handleValueChange(value: Record<string, unknown>) {
  formData.value = value
  emit('update:modelValue', value)
  
  if (props.validateOnChange) {
    runValidation()
  }
}

function runValidation(): ValidationError[] {
  const errors = validateSchema(formData.value, props.schema)
  validationErrors.value = errors
  return errors
}

function handleValidate() {
  const errors = runValidation()
  emit('validate', errors, formData.value)
  
  if (errors.length === 0) {
    MessagePlugin.success('验证通过')
  } else {
    MessagePlugin.warning(`发现 ${errors.length} 个验证错误`)
  }
  
  return errors
}

async function handleSubmit() {
  const errors = runValidation()
  
  if (errors.length > 0) {
    MessagePlugin.warning('请修正表单中的错误后再提交')
    emit('validate', errors, formData.value)
    return
  }
  
  submitting.value = true
  try {
    emit('submit', formData.value)
  } finally {
    submitting.value = false
  }
}

function handleReset() {
  formData.value = getDefaultValue(props.schema) as Record<string, unknown>
  validationErrors.value = []
  emit('update:modelValue', formData.value)
  emit('reset')
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(formattedJson.value)
    MessagePlugin.success('已复制到剪贴板')
  } catch {
    MessagePlugin.error('复制失败')
  }
}

defineExpose({
  validate: handleValidate,
  reset: handleReset,
  getData: () => formData.value,
  getErrors: () => validationErrors.value
})
</script>

<style scoped>
.json-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.json-editor-header {
  margin-bottom: 16px;
}

.json-editor-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.json-editor-description {
  margin: 0;
  font-size: 14px;
  color: var(--td-text-color-secondary);
}

.json-editor-content {
  flex: 1;
}

.json-editor-footer {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--td-component-border);
}

.json-editor-preview {
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-default);
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--td-bg-color-container);
  border-bottom: 1px solid var(--td-component-border);
}

.preview-title {
  font-weight: 500;
  font-size: 14px;
}

.preview-content {
  margin: 0;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  background: var(--td-bg-color-container);
  max-height: 300px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.json-editor-errors {
  border: 1px solid var(--td-error-color);
  border-radius: var(--td-radius-default);
  padding: 12px;
  background: var(--td-error-color-1);
}

.errors-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--td-error-color);
  font-weight: 500;
}

.errors-icon {
  font-size: 16px;
}

.errors-list {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: var(--td-text-color-primary);
}

.errors-list li {
  margin-bottom: 4px;
}

.error-path {
  color: var(--td-text-color-secondary);
}

.error-message {
  color: var(--td-error-color);
}
</style>
