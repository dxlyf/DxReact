<script setup lang="ts">
import { ref, inject, computed } from 'vue'
import type { ArrayFieldConfig, UpdateValueFn, ObjectFieldConfig } from '../types'
import { UPDATE_VALUE_KEY } from '../types'
import FieldRenderer from './FieldRenderer.vue'

const props = defineProps<{
  field: ArrayFieldConfig
  items: any[]
  path: (string | number)[]
  canRemove: boolean
  sortable: boolean
}>()

const updateValue = inject<UpdateValueFn>(UPDATE_VALUE_KEY)!
const activeTab = ref('0')

const itemObjectField = computed<ObjectFieldConfig>(() => {
  const items = props.field.items
  if (!items) return { valueType: 'object', key: '__item__' }
  const { display, ...rest } = items as any
  return { ...rest, displayType: display || 'form' } as ObjectFieldConfig
})

const canAddField = computed(() => itemObjectField.value.addedProperty !== false)

// FieldRenderer refs per tab
const fieldRefs = ref<Record<number, InstanceType<typeof FieldRenderer>>>({})
const setFieldRef = (idx: number) => (el: any) => {
  if (el) fieldRefs.value[idx] = el
}

const openAddField = () => {
  const idx = Number(activeTab.value)
  fieldRefs.value[idx]?.openObjectAddDialog()
}

const removeItem = (idx: number) => {
  const newItems = props.items.filter((_, i) => i !== idx)
  updateValue(props.path, newItems)
  if (newItems.length) {
    activeTab.value = `${Math.min(idx, newItems.length - 1)}`
  } else {
    activeTab.value = '0'
  }
}

const moveItem = (idx: number, dir: 'up' | 'down') => {
  if (dir === 'up' && idx === 0) return
  if (dir === 'down' && idx === props.items.length - 1) return
  const arr = [...props.items]
  const target = dir === 'up' ? idx - 1 : idx + 1
  const [item] = arr.splice(idx, 1)
  arr.splice(target, 0, item)
  updateValue(props.path, arr)
  activeTab.value = `${target}`
}
</script>

<template>
  <div class="array-tabs">
    <t-tabs
      v-if="items.length"
      v-model="activeTab"
      placement="top"
      size="medium"
      @remove="(ctx) => removeItem(Number(ctx.value))"
    >
      <template #action>
        <div class="flex gap-2 items-center pr-2">
          <t-button v-if="canAddField"  variant="text" size="small" @click="openAddField">
          <template #icon><t-icon name="add" /></template>
        </t-button>
        <t-button v-if="sortable && items.length > 1" variant="text" size="small" :disabled="Number(activeTab) === 0" @click="moveItem(Number(activeTab), 'up')">
          <template #icon><t-icon name="chevron-up" /></template>
        </t-button>
        <t-button v-if="sortable && items.length > 1" variant="text" size="small" :disabled="Number(activeTab) === items.length - 1" @click="moveItem(Number(activeTab), 'down')">
          <template #icon><t-icon name="chevron-down" /></template>
        </t-button>
      </div>
      </template>
      <t-tab-panel
        v-for="(item, idx) in items"
        :key="idx"
        :value="`${idx}`"
        :label="`${field.label || '项'} #${idx + 1}`"
        :removable="canRemove"
      >
        <div class="tab-content">
          <FieldRenderer
            :ref="setFieldRef(idx)"
            :field="itemObjectField"
            :model-value="item"
            :path="[...path, idx]"
            hide-object-header
            inline-object
          />
        </div>
      </t-tab-panel>
    </t-tabs>
  </div>
</template>

<style scoped>
.array-tabs {
  border: 1px solid #dfe1e6;
  border-radius: 8px;
  padding: 8px 12px 12px;
  background: #fafafa;
}
.tab-content {
  padding-top: 12px;
}
.array-tabs :deep(.t-tabs__operations.t-tabs__operations--right){
  top:0;
  bottom:0;
}
</style>
