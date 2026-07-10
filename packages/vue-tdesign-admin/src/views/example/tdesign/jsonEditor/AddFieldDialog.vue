<script setup lang="ts">
import { ref } from 'vue'
import type { FormFieldConfig, ValueType } from './types'
import { extraFieldTemplates, getExtraFields, addExtraField, addExtraFieldToObject } from './utils'

const props = defineProps<{
  visible: boolean
  field: FormFieldConfig | null
  data: Record<string, any>
  itemIndex: number
  dataKey: string
  /** 'array' = 数组项内的额外字段, 'object' = 对象本身的额外字段 */
  mode?: 'array' | 'object'
  /** 对象模式下的模板列表（当 mode='object' 时使用） */
  objectTemplates?: any[]
}>()

const emit = defineEmits<{
  'update:visible': [val: boolean]
  confirm: [key: string, val: any]
}>()

const selectedTemplates = ref<string[]>([])
const customFieldName = ref('')
const customFieldType = ref<ValueType>('string')

const typeOptions: { label: string; value: ValueType }[] = [
  { label: '字符串', value: 'string' },
  { label: '数字', value: 'number' },
  { label: '布尔', value: 'boolean' },
  { label: '对象', value: 'object' },
  { label: '数组', value: 'array' },
]

const close = () => {
  selectedTemplates.value = []
  customFieldName.value = ''
  customFieldType.value = 'string'
  emit('update:visible', false)
}

const onConfirm = () => {
  if (!props.field) { close(); return }

  if (props.mode === 'object') {
    let obj = props.data
    const tmpls = (props.objectTemplates || extraFieldTemplates(props.field)) as any[]
    selectedTemplates.value.forEach((key) => {
      const tmpl = tmpls?.find((t: any) => t.key === key)
      const vt = tmpl?.valueType || 'string'
      obj = addExtraFieldToObject(obj, key, vt, tmpls)
    })
    const name = customFieldName.value.trim()
    if (name) {
      const extraFields = [...(obj._extraFields || [])]
      if (!extraFields.includes(name)) {
        obj = addExtraFieldToObject(obj, name, customFieldType.value, tmpls)
      }
    }
    emit('confirm', props.dataKey, obj)
  } else {
    let newData = props.data
    selectedTemplates.value.forEach((key) => {
      const tmpl = extraFieldTemplates(props.field!).find((t) => t.key === key)
      const vt = tmpl?.valueType || 'string'
      newData = addExtraField(props.field!, props.itemIndex, key, vt, newData)
    })
    const name = customFieldName.value.trim()
    if (name) {
      const item = { ...((newData[props.field.key] || [])[props.itemIndex] || {}) }
      const extraFields = [...(item._extraFields || [])]
      if (!extraFields.includes(name)) {
        newData = addExtraField(props.field!, props.itemIndex, name, customFieldType.value, newData)
      }
    }
    emit('confirm', props.dataKey, newData)
  }
  close()
}

const isObjectMode = () => props.mode === 'object'
const getTemplates = () => {
  if (isObjectMode()) return (props.objectTemplates as any[]) || extraFieldTemplates(props.field!)
  return props.field ? extraFieldTemplates(props.field) : []
}
const getExisting = () => {
  const obj = isObjectMode() ? props.data : (props.field ? (props.data[props.field.key] || [])[props.itemIndex] : null)
  return obj ? getExtraFields(obj) : []
}
</script>

<template>
  <t-dialog
    :visible="visible"
    header="添加字段"
    :on-confirm="onConfirm"
    :on-close="close"
    width="480"
  >
    <template v-if="field">
      <div v-if="getTemplates().length" class="mb-4">
        <label class="section-label">预定义字段</label>
        <t-checkbox-group v-model="selectedTemplates" class="flex flex-col gap-1">
          <t-checkbox
            v-for="tmpl in getTemplates()"
            :key="tmpl.key"
            :value="tmpl.key"
            :disabled="getExisting().includes(tmpl.key)"
          >
            {{ tmpl.label }} <span class="text-[#86909c] text-xs ml-1">({{ tmpl.valueType }})</span>
          </t-checkbox>
        </t-checkbox-group>
      </div>
      <div>
        <label class="section-label">自定义字段</label>
        <div class="flex gap-2">
          <t-input
            v-model="customFieldName"
            placeholder="字段名"
            class="flex-1"
          />
          <t-select v-model="customFieldType" style="width: 100px">
            <t-option v-for="opt in typeOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </t-select>
        </div>
      </div>
    </template>
  </t-dialog>
</template>

<style scoped>
.section-label {
  display: block;
  font-size: 13px;
  color: #4e5969;
  margin-bottom: 8px;
  font-weight: 500;
}
</style>
