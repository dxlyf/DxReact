<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import type { ObjectFieldConfig, FieldConfig, UpdateValueFn } from '../types'
import { UPDATE_VALUE_KEY } from '../types'
import { isFieldHidden, getDefaultByType } from '../utils'
import FieldRenderer from './FieldRenderer.vue'
import AddFieldDialog from './AddFieldDialog.vue'

const props = defineProps<{
  field: ObjectFieldConfig
  modelValue: any
  path: (string | number)[]
  hideAddButton?: boolean
  /** 内联模式：modelValue 即为对象自身，不额外添加 field.key 到路径 */
  inline?: boolean
}>()

const updateValue = inject<UpdateValueFn>(UPDATE_VALUE_KEY)!

/** 是否是根层级（path 为空，说明当前对象就是 modelValue 自身） */
const isRoot = computed(() => props.path.length === 0 || props.inline === true)

const isCardMode = computed(() => (props.field.displayType || 'card') === 'card')

const currentPath = computed(() =>
  isRoot.value ? props.path : [...props.path, props.field.key]
)

const obj = computed(() => {
  const raw = isRoot.value ? props.modelValue : props.modelValue?.[props.field.key]
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
})

const addDialogVisible = ref(false)
const collapsed = ref(false)
const openAddDialog = () => { addDialogVisible.value = true }
defineExpose({ openAddDialog })

// 合并字段：配置字段 + properties 模板 + 已添加的自定义字段
const mergedFields = computed<FieldConfig[]>(() => {
  const base = [...(props.field.fields || [])]
  const objVal = obj.value

  // properties 模板中已添加的
  const tmpls = props.field.properties || []
  tmpls.forEach((t) => {
    if (objVal[t.key] !== undefined) {
      base.push(t)
    }
  })

  // 已注册的自定义字段（从 _extraFields 读取）
  const extraKeys: string[] = objVal._extraFields || []

  // 自动检测数据中存在的额外 key（仅在启用自定义字段时）
  const canAddProp = props.field.addedProperty !== false
  const detectedKeys: string[] = []
  if (canAddProp) {
    const allKnownKeys = new Set([
      ...base.map((f) => f.key),
      ...extraKeys,
      '_extraFields',
      '_extraFieldTypes',
    ])
    detectedKeys.push(...Object.keys(objVal).filter((k) => !allKnownKeys.has(k)))
  }

  ;[...extraKeys, ...detectedKeys].forEach((key) => {
    if (!base.find((f) => f.key === key)) {
      const vt = objVal._extraFieldTypes?.[key] || 'string'
      base.push({ key, label: key, valueType: vt })
    }
  })

  return base.filter((f) => !isFieldHidden(f, objVal))
})

const onObjectUpdate = (childPath: (string | number)[], val: any) => {
  updateValue(childPath, val)
}

const onAddFieldConfirm = (selects: string[], customName: string, customType: string) => {
  const current = { ...obj.value }
  const extraFields: string[] = [...(current._extraFields || [])]

  // 预定义模板
  const tmpls = props.field.properties || []
  selects.forEach((key) => {
    if (current[key] === undefined && !extraFields.includes(key)) {
      const tmpl = tmpls.find((t) => t.key === key)
      current[key] = tmpl?.defaultValue ?? getDefaultByType(tmpl?.valueType || 'string')
      extraFields.push(key)
      if (tmpl) {
        current._extraFieldTypes = { ...(current._extraFieldTypes || {}), [key]: tmpl.valueType }
      }
    }
  })

  // 自定义字段
  const name = customName.trim()
  if (name && current[name] === undefined && !extraFields.includes(name)) {
    current[name] = getDefaultByType(customType as any)
    extraFields.push(name)
    current._extraFieldTypes = { ...(current._extraFieldTypes || {}), [name]: customType }
  }

  current._extraFields = extraFields
  updateValue(currentPath.value, current)
  addDialogVisible.value = false
}
</script>

<template>
  <!-- Card 模式 -->
  <t-card
    v-if="isCardMode"
    :bordered="true"
    size="small"
  >
    <template #header>
      <div class="card-header-inner">
        <t-button variant="text" size="small" @click.stop="collapsed = !collapsed">
          <t-icon :name="collapsed ? 'chevron-down' : 'chevron-up'" />
        </t-button>
        <span class="card-title">
          <span v-if="field.required" class="text-red-500 mr-0.5">*</span>
          {{ field.label }}
        </span>
        <div class="card-header-spacer"></div>
        <t-button variant="base" size="small" @click="addDialogVisible = true" v-if="field.addedProperty !== false && !hideAddButton">
          <template #icon><t-icon name="add" /> </template>添加字段
        </t-button>
      </div>
    </template>

    <div v-show="!collapsed">
      <div class="object-body">
        <FieldRenderer
          v-for="f in mergedFields"
          :key="f.key"
          :field="f"
          :model-value="obj"
          :path="currentPath"
        />
      </div>

      <span class="field-help" v-if="field.help">{{ field.help }}</span>
    </div>

    <AddFieldDialog
      :visible="addDialogVisible"
      :properties="field.properties || []"
      :allow-custom="field.defineProperty !== false"
      :existing-keys="Object.keys(obj)"
      @update:visible="addDialogVisible = $event"
      @confirm="onAddFieldConfirm"
    />
  </t-card>

  <!-- Form 模式（简单内联） -->
  <div v-else class="object-form">
    <div class="object-form-header" v-if="field.label">
      <label class="field-label">
        <span v-if="field.required" class="text-red-500 mr-0.5">*</span>
        {{ field.label }}
      </label>
      <t-button variant="text" size="small" @click="addDialogVisible = true" v-if="field.addedProperty !== false && !hideAddButton">
        <t-icon name="add" /> 添加字段
      </t-button>
    </div>

    <div class="object-form-body">
      <FieldRenderer
        v-for="f in mergedFields"
        :key="f.key"
        :field="f"
        :model-value="obj"
        :path="currentPath"
      />
    </div>

    <span class="field-help" v-if="field.help">{{ field.help }}</span>

    <AddFieldDialog
      :visible="addDialogVisible"
      :properties="field.properties || []"
      :allow-custom="field.defineProperty !== false"
      :existing-keys="Object.keys(obj)"
      @update:visible="addDialogVisible = $event"
      @confirm="onAddFieldConfirm"
    />
  </div>
</template>

<style scoped>
.card-header-inner {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}
.card-title {
  font-size: 13px;
  font-weight: 500;
  color: #4e5969;
}
.card-header-spacer {
  flex: 1;
}
.object-body {
  border: 1px solid #dfe1e6;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
}
.object-form {
  margin-bottom: 16px;
}
.object-form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.object-form-body {
  border: 1px solid #dfe1e6;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
}
.field-label {
  display: block;
  font-size: 13px;
  color: #4e5969;
  font-weight: 500;
}
.field-help {
  display: block;
  font-size: 12px;
  color: #86909c;
  margin-top: 4px;
}
</style>
