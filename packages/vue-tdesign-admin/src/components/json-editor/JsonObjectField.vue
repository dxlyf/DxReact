<template>
  <div class="json-object-field">
    <div class="object-header">
      <span class="object-title">{{ fieldLabel }}</span>
      <div class="header-actions">
        <t-button size="small" variant="text" @click="showAddPropertyDialog">
          <t-icon name="add" />
          添加属性
        </t-button>
        <t-button size="small" variant="text" @click="toggleCollapse">
          <t-icon :name="collapsed ? 'chevron-down' : 'chevron-up'" />
        </t-button>
      </div>
    </div>
    
    <div v-show="!collapsed" class="object-content">
      <json-field
        v-for="prop in schema"
        :key="prop.key"
        :field="prop"
        :value="localValue[prop.key]"
        @update:value="(val) => updateProperty(prop.key, val)"
        @remove-property="removeProperty"
      />
    </div>
    
    <t-dialog
      v-model:visible="showDialog"
      header="添加自定义属性"
      @confirm="confirmAddProperty"
      @cancel="showDialog = false"
    >
      <t-form :data="newProperty" label-width="100px">
        <t-form-item label="属性名" name="key">
          <t-input v-model="newProperty.key" placeholder="请输入属性名" />
        </t-form-item>
        <t-form-item label="类型" name="type">
          <t-select v-model="newProperty.type" placeholder="请选择类型">
            <t-option value="string" label="字符串" />
            <t-option value="number" label="数字" />
            <t-option value="boolean" label="布尔值" />
            <t-option value="object" label="对象" />
            <t-option value="array" label="数组" />
          </t-select>
        </t-form-item>
        <t-form-item label="必填" name="required">
          <t-switch v-model="newProperty.required" />
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import JsonField from './JsonField.vue'
import type { FieldSchema, FieldType } from './index.vue'

interface Props {
  schema: FieldSchema[]
  modelValue: Record<string, any>
  fieldLabel?: string
}

interface Emits {
  (e: 'update:modelValue', value: Record<string, any>): void
  (e: 'update:schema', value: FieldSchema[]): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  fieldLabel: '对象'
})

const emit = defineEmits<Emits>()

const localValue = ref<Record<string, any>>({ ...props.modelValue })
const collapsed = ref(false)
const showDialog = ref(false)

const newProperty = ref({
  key: '',
  type: 'string' as FieldType,
  required: false
})

watch(() => props.modelValue, (newVal) => {
  localValue.value = { ...newVal }
}, { deep: true })

const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

const updateProperty = (key: string, value: any) => {
  localValue.value[key] = value
  emit('update:modelValue', { ...localValue.value })
}

const showAddPropertyDialog = () => {
  newProperty.value = {
    key: '',
    type: 'string',
    required: false
  }
  showDialog.value = true
}

const confirmAddProperty = () => {
  if (!newProperty.value.key.trim()) {
    MessagePlugin.warning('请输入属性名')
    return
  }

  const existingKey = props.schema.find(s => s.key === newProperty.value.key)
  if (existingKey) {
    MessagePlugin.warning('属性名已存在')
    return
  }

  const customProperty: FieldSchema = {
    key: newProperty.value.key,
    label: newProperty.value.key,
    type: newProperty.value.type,
    required: newProperty.value.required,
    isCustom: true
  }

  const newSchema = [...props.schema, customProperty]
  emit('update:schema', newSchema)

  switch (newProperty.value.type) {
    case 'string':
      localValue.value[newProperty.value.key] = ''
      break
    case 'number':
      localValue.value[newProperty.value.key] = 0
      break
    case 'boolean':
      localValue.value[newProperty.value.key] = false
      break
    case 'object':
      localValue.value[newProperty.value.key] = {}
      break
    case 'array':
      localValue.value[newProperty.value.key] = []
      break
  }

  emit('update:modelValue', { ...localValue.value })
  showDialog.value = false
  MessagePlugin.success('属性添加成功')
}

const removeProperty = (key: string) => {
  const index = props.schema.findIndex(s => s.key === key)
  if (index > -1) {
    const newSchema = [...props.schema]
    newSchema.splice(index, 1)
    emit('update:schema', newSchema)
    delete localValue.value[key]
    emit('update:modelValue', { ...localValue.value })
  }
}
</script>

<style scoped>
.json-object-field {
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-default);
  margin-bottom: 16px;
  background-color: var(--td-bg-color-container);
}

.object-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: var(--td-bg-color-container-hover);
  border-bottom: 1px solid var(--td-component-border);
}

.object-title {
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.object-content {
  padding: 16px;
}
</style>
