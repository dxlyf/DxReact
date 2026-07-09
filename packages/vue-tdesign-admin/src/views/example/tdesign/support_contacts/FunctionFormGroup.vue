<script setup lang="ts">
import { computed, ref, reactive, nextTick } from 'vue'
import DynamicForm, { type FormFieldConfig } from './DynamicForm.vue'

export type FunctionButtonConfig = {
  key: string
  label: string
  fields: FormFieldConfig[]
}

type Props = {
  buttons: FunctionButtonConfig[]
  layout?: 'tabs' | 'vertical'
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'tabs',
})

const model = defineModel<Record<string, Record<string, any>[]>>({
  default: () => ({}),
})

// 当前激活的 tab
const activeTab = ref<string>('')

// 每个按钮类型的卡片展开状态 { buttonKey: { [index]: boolean } }
const expandStates = reactive<Record<string, Record<number, boolean>>>({})

// 每个按钮类型下卡片的当前 tab（仅 layout='tabs' 时使用）
const cardActiveTab = reactive<Record<string, string>>({})

// 每个按钮类型的列表数据（直接供垂直布局拖拽使用）
const dragLists = ref<Record<string, Record<string, any>[]>>({})

// 收集所有 DynamicForm 实例引用（用于校验）
const formRefs = ref<Record<string, InstanceType<typeof DynamicForm>>>({})

const getFormRefKey = (buttonKey: string, index: number) => `${buttonKey}-${index}`

const setFormRef = (buttonKey: string, index: number) => (el: any) => {
  if (el) {
    formRefs.value[getFormRefKey(buttonKey, index)] = el
  } else {
    delete formRefs.value[getFormRefKey(buttonKey, index)]
  }
}

// 初始化某个按钮类型的数据
const ensureList = (button: FunctionButtonConfig) => {
  if (!model.value[button.key]) {
    model.value[button.key] = []
  }
  if (!dragLists.value[button.key]) {
    dragLists.value[button.key] = model.value[button.key]
  }
  if (expandStates[button.key] === undefined) {
    expandStates[button.key] = {}
  }
}

// 创建空条目
const createEmptyEntry = (button: FunctionButtonConfig) => {
  const entry: Record<string, any> = {}
  button.fields.forEach((field) => {
    if (field.defaultValue !== undefined) {
      entry[field.key] = field.defaultValue
    } else if (field.type === 'switch') {
      entry[field.key] = false
    } else if (field.type === 'select') {
      entry[field.key] = []
    } else {
      entry[field.key] = ''
    }
  })
  return entry
}

// 添加新卡片
const handleAdd = (button: FunctionButtonConfig) => {
  ensureList(button)
  const newEntry = createEmptyEntry(button)
  model.value[button.key] = [...(model.value[button.key] || []), newEntry]
  dragLists.value[button.key] = model.value[button.key]
  // 新添加的卡片展开/选中
  const idx = model.value[button.key].length - 1
  if (!expandStates[button.key]) expandStates[button.key] = {}
  expandStates[button.key][idx] = true
  Object.keys(expandStates[button.key]).forEach((k) => {
    if (Number(k) !== idx) {
      expandStates[button.key][Number(k)] = false
    }
  })
  // 新添加的卡片作为当前 tab
  cardActiveTab[button.key] = `${idx}`
  nextTick(() => {
    activeTab.value = button.key
  })
}

// 删除卡片
const handleRemove = (buttonKey: string, index: number) => {
  const list = [...(model.value[buttonKey] || [])]
  list.splice(index, 1)
  model.value[buttonKey] = list
  dragLists.value[buttonKey] = list
  delete formRefs.value[getFormRefKey(buttonKey, index)]
  // 更新 expandStates 的索引
  if (expandStates[buttonKey]) {
    const newStates: Record<number, boolean> = {}
    Object.entries(expandStates[buttonKey]).forEach(([k, v]) => {
      const ki = Number(k)
      if (ki < index) {
        newStates[ki] = v
      } else if (ki > index) {
        newStates[ki - 1] = v
      }
    })
    expandStates[buttonKey] = newStates
  }
  // 调整当前 tab
  if (cardActiveTab[buttonKey] === `${index}`) {
    cardActiveTab[buttonKey] = list.length > 0 ? '0' : undefined as any
  } else if (Number(cardActiveTab[buttonKey]) > index) {
    cardActiveTab[buttonKey] = `${Number(cardActiveTab[buttonKey]) - 1}`
  }
}

const handleEntryUpdate = (buttonKey: string, index: number, val: Record<string, any>) => {
  const list = [...(model.value[buttonKey] || [])]
  list[index] = val
  model.value[buttonKey] = list
  dragLists.value[buttonKey] = list
}

// 切换卡片折叠（垂直布局）
const toggleExpand = (buttonKey: string, index: number) => {
  if (!expandStates[buttonKey]) expandStates[buttonKey] = {}
  expandStates[buttonKey][index] = !expandStates[buttonKey][index]
}

// 卡片 tabs 拖拽排序
const handleCardTabSort = (btnKey: string, ctx: { currentIndex: number; targetIndex: number }) => {
  const list = [...(model.value[btnKey] || [])]
  const [removed] = list.splice(ctx.currentIndex, 1)
  list.splice(ctx.targetIndex, 0, removed)
  model.value[btnKey] = list
  dragLists.value[btnKey] = list
}

// 是否有任何已添加的条目
const hasEntries = computed(() => {
  return Object.values(model.value).some((list) => list && list.length > 0)
})

// 初始化第一个有数据的 tab
if (!activeTab.value && props.buttons.length > 0) {
  activeTab.value = props.buttons[0].key
}

defineExpose({
  async validateAll() {
    const refs = Object.values(formRefs.value)
    for (const form of refs) {
      const result = await form?.validate?.()
      if (result !== true) {
        return result
      }
    }
    return true
  },
})
</script>

<template>
  <div class="function-form-group">
    <!-- 功能按钮行 -->
    <div class="flex flex-wrap gap-2 mb-4">
      <t-button
        v-for="btn in buttons"
        :key="btn.key"
        variant="outline"
        @click="handleAdd(btn)"
      >
        + {{ btn.label }}
      </t-button>
      <div v-if="!hasEntries" class="text-sm text-[#86909c] self-center ml-2">点击上方按钮添加内容</div>
    </div>

    <!-- 无内容时隐藏 -->
    <template v-if="hasEntries">
      <!-- 外层：按钮类型用 t-tabs 切换 -->
      <t-tabs v-model="activeTab" :placement="buttons.length <= 3 ? 'top' : 'left'" size="medium">
        <t-tab-panel
          v-for="btn in buttons"
          :key="btn.key"
          :value="btn.key"
          :label="`${btn.label} (${(model[btn.key] || []).length})`"
          :disabled="!(model[btn.key] || []).length"
        >
          <!-- ====== 卡片 tabs 布局（可拖拽排序）= ====== -->
          <template v-if="layout === 'tabs'">
            <t-tabs
              v-if="(dragLists[btn.key] || []).length"
              v-model="cardActiveTab[btn.key]"
              placement="top"
              size="small"
              :default-value="'0'"
              class="card-tabs"
              theme="card"
              :drag-sort="true"
               @drag-sort="(ctx: any) => handleCardTabSort(btn.key, ctx)"
              @remove="(ctx: { value: string }) => handleRemove(btn.key, Number(ctx.value))"
            >
              <t-tab-panel
                v-for="(entry, idx) in dragLists[btn.key] || []"
                :key="`${btn.key}-${idx}`"
                :value="`${idx}`"
                :label="`${btn.label} #${idx + 1}`"
                :removable="true"
              >
                <div class="pt-4">
                  <DynamicForm
                    :ref="setFormRef(btn.key, idx)"
                    :fields="btn.fields"
                    :model-value="entry"
                    @update:model-value="handleEntryUpdate(btn.key, idx, $event)"
                  />
                </div>
              </t-tab-panel>
            </t-tabs>
          </template>

          <!-- ====== 卡片垂直布局（可折叠）= ====== -->
          <template v-else>
            <div class="space-y-3">
              <div
                v-for="(entry, idx) in dragLists[btn.key] || []"
                :key="`${btn.key}-${idx}`"
                class="border border-solid border-[#dfe1e6] rounded-lg overflow-hidden"
              >
                <div
                  class="flex items-center gap-2 px-4 py-2 bg-[#f5f6f8] border-b border-solid border-[#dfe1e6] cursor-pointer select-none"
                  @click="toggleExpand(btn.key, idx)"
                >
                  <span class="text-sm font-medium text-[#4e5969] flex-1">{{ btn.label }} #{{ idx + 1 }}</span>
                  <t-icon
                    :name="expandStates[btn.key]?.[idx] ? 'chevron-up' : 'chevron-down'"
                    class="text-[#86909c] flex-none"
                  />
                  <t-button
                    theme="danger"
                    variant="text"
                    size="small"
                    class="flex-none"
                    @click.stop="handleRemove(btn.key, idx)"
                  >
                    删除
                  </t-button>
                </div>
                <div v-show="expandStates[btn.key]?.[idx]" class="p-4">
                  <DynamicForm
                    :ref="setFormRef(btn.key, idx)"
                    :fields="btn.fields"
                    :model-value="entry"
                    @update:model-value="handleEntryUpdate(btn.key, idx, $event)"
                  />
                </div>
              </div>
            </div>
          </template>
        </t-tab-panel>
      </t-tabs>
    </template>
  </div>
</template>

<style scoped>
.function-form-group {
  width: 100%;
}
.drag-handle {
  touch-action: none;
}
.card-tabs {
  --td-tab-item-active-bg: #f5f6f8;
}
.card-tabs :deep(.t-tabs__nav-item) {
  background: #fafafa;
  border: 1px solid #e8e8e8;
  margin-right: 4px;
}
.card-tabs :deep(.t-tabs__nav-item.t-is-active) {
  background: #fff;
  border-bottom-color: #fff;
}
.card-tabs :deep(.t-tabs__nav-wrap) {
  margin-bottom: 0;
}
</style>
