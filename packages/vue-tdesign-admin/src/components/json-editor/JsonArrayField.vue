<template>
  <div class="json-array-field">
    <div class="array-header">
      <span class="array-title">{{ fieldLabel }}</span>
      <div class="array-actions">
        <t-select
          v-model="displayMode"
          size="small"
          style="width: 100px"
        >
          <t-option value="card" label="卡片" />
          <t-option value="table" label="表格" />
          <t-option value="tabs" label="标签页" />
        </t-select>
        <t-button size="small" variant="text" @click="toggleCollapse">
          <t-icon :name="collapsed ? 'chevron-down' : 'chevron-up'" />
        </t-button>
        <t-button size="small" variant="text" theme="primary" @click="addItem">
          <t-icon name="add" />
          添加项
        </t-button>
        <t-button 
          v-if="localValue.length > 0"
          size="small" 
          variant="text" 
          theme="danger" 
          @click="clearAll"
        >
          <t-icon name="delete" />
          清空
        </t-button>
      </div>
    </div>
    
    <div v-show="!collapsed" class="array-content">
      <template v-if="displayMode === 'card'">
        <div 
          v-for="(item, index) in localValue" 
          :key="index"
          class="array-item"
        >
          <div class="item-header">
            <span class="item-title">项 {{ index + 1 }}</span>
            <t-button size="small" variant="text" theme="danger" @click="removeItem(index)">
              <t-icon name="close" />
            </t-button>
          </div>
          
          <div class="item-content">
            <json-field
              :field="schema"
              :value="item"
              @update:value="(val) => updateItem(index, val)"
            />
          </div>
        </div>
      </template>
      
      <template v-else-if="displayMode === 'table'">
        <div class="array-table">
          <div class="table-header">
            <div class="table-cell index-cell">序号</div>
            <div class="table-cell value-cell">值</div>
            <div class="table-cell action-cell">操作</div>
          </div>
          <div 
            v-for="(item, index) in localValue" 
            :key="index"
            class="table-row"
          >
            <div class="table-cell index-cell">{{ index + 1 }}</div>
            <div class="table-cell value-cell">
              <json-field
                :field="schema"
                :value="item"
                @update:value="(val) => updateItem(index, val)"
              />
            </div>
            <div class="table-cell action-cell">
              <t-button size="small" variant="text" theme="danger" @click="removeItem(index)">
                <t-icon name="delete" />
              </t-button>
            </div>
          </div>
        </div>
      </template>
      
      <template v-else-if="displayMode === 'tabs'">
        <t-tabs v-model="activeTab" @change="handleTabChange">
          <t-tab-panel
            v-for="(item, index) in localValue"
            :key="index"
            :value="index"
            :label="`项 ${index + 1}`"
          >
            <div class="tab-content">
              <div class="tab-actions">
                <t-button size="small" variant="text" theme="danger" @click="removeItem(index)">
                  <t-icon name="delete" />
                  删除此项
                </t-button>
              </div>
              <json-field
                :field="schema"
                :value="item"
                @update:value="(val) => updateItem(index, val)"
              />
            </div>
          </t-tab-panel>
          <t-tab-panel v-if="localValue.length === 0" value="empty" label="空">
            <div class="empty-tip">暂无数据，点击"添加项"按钮添加</div>
          </t-tab-panel>
        </t-tabs>
      </template>
      
      <div v-if="displayMode !== 'tabs' && localValue.length === 0" class="empty-tip">
        暂无数据，点击"添加项"按钮添加
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import JsonField from './JsonField.vue'
import type { FieldSchema } from './index.vue'

interface Props {
  schema: FieldSchema
  modelValue: any[]
  fieldLabel?: string
}

interface Emits {
  (e: 'update:modelValue', value: any[]): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  fieldLabel: '数组'
})

const emit = defineEmits<Emits>()

const localValue = ref<any[]>([...props.modelValue])
const collapsed = ref(false)
const displayMode = ref<'card' | 'table' | 'tabs'>(props.schema.displayMode || 'card')
const activeTab = ref(0)

watch(() => props.modelValue, (newVal) => {
  localValue.value = [...newVal]
}, { deep: true })

const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

const addItem = () => {
  const newItem = getDefaultValue()
  localValue.value.push(newItem)
  emit('update:modelValue', [...localValue.value])
  if (displayMode.value === 'tabs') {
    activeTab.value = localValue.value.length - 1
  }
}

const removeItem = (index: number) => {
  localValue.value.splice(index, 1)
  emit('update:modelValue', [...localValue.value])
  if (displayMode.value === 'tabs' && activeTab.value >= localValue.value.length) {
    activeTab.value = Math.max(0, localValue.value.length - 1)
  }
}

const clearAll = () => {
  localValue.value = []
  emit('update:modelValue', [])
  activeTab.value = 0
}

const updateItem = (index: number, value: any) => {
  localValue.value[index] = value
  emit('update:modelValue', [...localValue.value])
}

const handleTabChange = (value: number) => {
  activeTab.value = value
}

const getDefaultValue = () => {
  switch (props.schema.type) {
    case 'string':
      return ''
    case 'number':
      return 0
    case 'boolean':
      return false
    case 'object':
      return {}
    case 'array':
      return []
    default:
      return ''
  }
}
</script>

<style scoped>
.json-array-field {
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-default);
  margin-bottom: 16px;
  background-color: var(--td-bg-color-container);
}

.array-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: var(--td-bg-color-container-hover);
  border-bottom: 1px solid var(--td-component-border);
}

.array-title {
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.array-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.array-content {
  padding: 16px;
}

.array-item {
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-default);
  margin-bottom: 12px;
  background-color: var(--td-bg-color-page);
}

.array-item:last-child {
  margin-bottom: 0;
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: var(--td-bg-color-container-hover);
  border-bottom: 1px solid var(--td-component-border);
}

.item-title {
  font-weight: 500;
  color: var(--td-text-color-primary);
}

.item-content {
  padding: 12px;
}

.array-table {
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-default);
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 60px 1fr 80px;
  background-color: var(--td-bg-color-container-hover);
  border-bottom: 1px solid var(--td-component-border);
}

.table-row {
  display: grid;
  grid-template-columns: 60px 1fr 80px;
  border-bottom: 1px solid var(--td-component-border);
}

.table-row:last-child {
  border-bottom: none;
}

.table-cell {
  padding: 12px;
  display: flex;
  align-items: center;
}

.index-cell {
  justify-content: center;
  color: var(--td-text-color-secondary);
  font-weight: 500;
}

.value-cell {
  border-left: 1px solid var(--td-component-border);
  border-right: 1px solid var(--td-component-border);
}

.action-cell {
  justify-content: center;
}

.tab-content {
  padding: 16px;
}

.tab-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.empty-tip {
  text-align: center;
  padding: 24px;
  color: var(--td-text-color-placeholder);
}
</style>
