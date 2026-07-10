<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import type { FormFieldConfig, FormSchema, ObjectGroupConfig } from './types'
import FieldRenderer from './FieldRenderer.vue'
import AddFieldDialog from './AddFieldDialog.vue'
import { isFieldHidden } from './utils'

type Props = {
  schema: FormSchema
  modelValue: Record<string, any>
  depth?: number
}

const props = withDefaults(defineProps<Props>(), {
  depth: 0,
})
const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>]
  change: [values: Record<string, any>]
}>()

const formData = computed(() => props.modelValue)
const hasGroups = computed(() => !!(props.schema.groups && props.schema.groups.length > 0))

const groupKeyOf = (g: ObjectGroupConfig) => (g.key || g.label) as string

// ====== 基础数据操作 ======
const notifyChange = () => {
  const val = { ...formData.value }
  emit('update:modelValue', val)
  emit('change', val)
  props.schema.onChange?.(val)
}

const updateField = (key: string, val: any) => {
  const data = { ...formData.value, [key]: val }
  emit('update:modelValue', data)
  emit('change', data)
  props.schema.onChange?.(data)
}

/** groups 模式下更新指定 group key 的指定索引的项 */
const updateGroupItem = (gk: string, gi: number, val: Record<string, any>) => {
  const arr = [...(formData.value[gk] || [])]
  arr[gi] = val
  updateField(gk, arr)
}

// ====== 折叠状态 ======
const collapsedStates = ref<Record<string, Record<number, boolean>>>({})
const toggleCollapse = (fieldKey: string, idx: number) => {
  if (!collapsedStates.value[fieldKey]) {
    collapsedStates.value[fieldKey] = {}
  }
  collapsedStates.value[fieldKey][idx] = !collapsedStates.value[fieldKey][idx]
}

// ====== 分组（groups）操作 ======
/** 每个 group key 对应的当前激活 tab */
const activeGroupTabs = reactive<Record<string, string>>({})
const activeArrayTab = ref('')

const addGroup = (group: ObjectGroupConfig) => {
  const gk = groupKeyOf(group)
  const arr = [...(formData.value[gk] || []), {}]
  updateField(gk, arr)
  activeGroupTabs[gk] = `${arr.length - 1}`
}

const removeGroup = (gk: string, tabValue: string) => {
  const gi = Number(tabValue)
  const arr = [...(formData.value[gk] || [])]
  arr.splice(gi, 1)
  updateField(gk, arr)
  activeGroupTabs[gk] = arr.length ? `${Math.min(gi, arr.length - 1)}` : ''
}

// ====== 添加字段 Dialog ======
const addFieldVisible = ref(false)
const addFieldData = ref<Record<string, any>>({})
const addFieldField = ref<FormFieldConfig | null>(null)
const addFieldIdx = ref(-1)
const addFieldDataKey = ref('')
/** groups 模式下当前操作所属的组 key + 索引 */
const addFieldGroupKey = ref('')
const addFieldGroupIdx = ref(-1)

const openAddFieldDialog = (field: FormFieldConfig, idx: number, data: Record<string, any>, dataKey: string) => {
  addFieldField.value = field
  addFieldIdx.value = idx
  addFieldData.value = data
  addFieldDataKey.value = dataKey
  addFieldVisible.value = true
}

const openGroupAddFieldDialog = (gk: string, gi: number, field: FormFieldConfig, idx: number, data: Record<string, any>, dataKey: string) => {
  addFieldGroupKey.value = gk
  addFieldGroupIdx.value = gi
  openAddFieldDialog(field, idx, data, dataKey)
}

const onAddFieldConfirm = (key: string, val: any) => {
  if (addFieldGroupKey.value) {
    updateGroupItem(addFieldGroupKey.value, addFieldGroupIdx.value, val)
    addFieldGroupKey.value = ''
    addFieldGroupIdx.value = -1
  } else {
    updateField(key, val)
  }
}
</script>

<template>
  <div class="json-form" :style="{ marginLeft: depth > 0 ? '12px' : '0' }">
    <!-- ====== groups 模式：每个 group 独立区块 ====== -->
    <template v-if="hasGroups">
      <div v-for="group in schema.groups!" :key="groupKeyOf(group)" class="mb-6">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-sm font-medium text-[#1d2129]">{{ group.label }}</span>
          <t-button variant="outline" size="small" @click="addGroup(group)">
            <t-icon name="add" /> 添加{{ group.label }}
          </t-button>
        </div>

        <t-tabs
          v-if="(formData[groupKeyOf(group)] || []).length"
          :model-value="activeGroupTabs[groupKeyOf(group)] || '0'"
          @update:model-value="(val: string) => activeGroupTabs[groupKeyOf(group)] = val"
          placement="top"
          size="medium"
          @remove="(ctx) => removeGroup(groupKeyOf(group), ctx.value+'')"
        >
          <t-tab-panel
            v-for="(item, gi) in (formData[groupKeyOf(group)] || [])"
            :key="gi"
            :value="`${gi}`"
            :label="`${group.label} #${((gi as number) + 1)}`"
            :removable="true"
          >
            <div class="pt-3">
              <template v-for="(field, fi) in group.fields" :key="`${gi}-${fi}`">
                <template v-if="!isFieldHidden(field, formData)">
                  <FieldRenderer
                    :field="field"
                    :data="item || {}"
                    :data-key="groupKeyOf(group)"
                    :depth="depth"
                    :active-array-tab="activeArrayTab"
                    :collapsed-states="collapsedStates"
                    :plain-update="false"
                    @field-update="(k, val) => updateGroupItem(groupKeyOf(group), gi as number, val)"
                    @update-active-array-tab="(val) => activeArrayTab = val"
                    @change="notifyChange"
                    @open-add-field-dialog="(f, idx, d, dk) => openGroupAddFieldDialog(groupKeyOf(group), gi as number, f, idx, d, dk)"
                    @toggle-collapse="toggleCollapse"
                  />
                </template>
              </template>
            </div>
          </t-tab-panel>
        </t-tabs>
        <div v-else class="text-xs text-[#86909c] mb-2">暂无{{ group.label }}分组</div>
      </div>
    </template>

    <!-- ====== 平面 fields 模式 ====== -->
    <template v-else>
      <template v-for="field in schema.fields" :key="field.key">
        <template v-if="!isFieldHidden(field, formData)">
          <FieldRenderer
            :field="field"
            :data="formData"
            :data-key="field.key"
            :depth="depth"
            :active-array-tab="activeArrayTab"
            :collapsed-states="collapsedStates"
            :plain-update="true"
            @field-update="(key, val) => updateField(key, val)"
            @update-active-array-tab="(val) => activeArrayTab = val"
            @change="notifyChange"
            @open-add-field-dialog="openAddFieldDialog"
            @toggle-collapse="toggleCollapse"
          />
        </template>
      </template>
    </template>
  </div>

  <!-- ====== 添加字段弹窗 ====== -->
  <AddFieldDialog
    :visible="addFieldVisible"
    :field="addFieldField"
    :data="addFieldData"
    :item-index="addFieldIdx"
    :data-key="addFieldDataKey"
    @update:visible="addFieldVisible = $event"
    @confirm="onAddFieldConfirm"
  />
</template>

<style scoped>
.json-form {
  width: 100%;
}
</style>
