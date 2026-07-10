<script setup lang="ts">
import { ref } from 'vue'
import type { FieldConfig, ValueType } from '../types'

const props = defineProps<{
  visible: boolean
  /** 预定义字段模板 */
  properties: FieldConfig[]
  /** 是否允许输入自定义字段名 */
  allowCustom: boolean
  /** 已存在的 key 集合 */
  existingKeys: string[]
}>()

const emit = defineEmits<{
  'update:visible': [val: boolean]
  /** 确认：已选模板 key 列表, 自定义字段名, 自定义字段类型 */
  confirm: [selects: string[], customName: string, customType: string]
}>()

const selectedKeys = ref<string[]>([])
const customName = ref('')
const customType = ref<ValueType>('string')

const typeOptions: { label: string; value: ValueType }[] = [
  { label: '字符串', value: 'string' },
  { label: '数字', value: 'number' },
  { label: '布尔', value: 'boolean' },
  { label: '对象', value: 'object' },
  { label: '数组', value: 'array' },
]

const close = () => {
  selectedKeys.value = []
  customName.value = ''
  customType.value = 'string'
  emit('update:visible', false)
}

const onConfirm = () => {
  emit('confirm', selectedKeys.value, customName.value, customType.value)
  close()
}
</script>

<template>
  <t-dialog
    :visible="visible"
    header="添加字段"
    :on-confirm="onConfirm"
    :on-close="close"
    width="460"
  >
    <!-- 预定义字段 -->
    <div v-if="properties.length" class="mb-4">
      <label class="section-label">预定义字段</label>
      <t-checkbox-group v-model="selectedKeys" class="flex flex-col gap-1">
        <t-checkbox
          v-for="p in properties"
          :key="p.key"
          :value="p.key"
          :disabled="existingKeys.includes(p.key)"
        >
          {{ p.label || p.key }}
          <span class="text-[#86909c] text-xs ml-1">({{ p.valueType }})</span>
        </t-checkbox>
      </t-checkbox-group>
    </div>

    <!-- 自定义字段 -->
    <div v-if="allowCustom">
      <label class="section-label">自定义字段</label>
      <div class="flex gap-2">
        <t-input v-model="customName" placeholder="字段名（英文）" class="flex-1" />
        <t-select v-model="customType" style="width: 100px">
          <t-option v-for="opt in typeOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
        </t-select>
      </div>
    </div>
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
