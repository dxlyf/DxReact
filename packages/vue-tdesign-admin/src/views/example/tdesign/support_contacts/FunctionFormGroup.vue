<script setup lang="ts">
import { computed, ref, reactive, nextTick } from 'vue'
import { useDraggable } from 'vue-draggable-plus'
import DynamicForm, { type FormFieldConfig } from './DynamicForm.vue'

export type FunctionButtonConfig = {
  key: string
  label: string
  fields: FormFieldConfig[]
}

type Props = {
  buttons: FunctionButtonConfig[]
}

const props = defineProps<Props>()

const model = defineModel<Record<string, Record<string, any>[]>>({
  default: () => ({}),
})

// 当前激活的 tab
const activeTab = ref<string>('')

// 每个按钮类型的卡片展开状态 { buttonKey: { [index]: boolean } }
const expandStates = reactive<Record<string, Record<number, boolean>>>({})

// 每个按钮类型的可拖拽列表 DOM 引用
const dragEls = ref<Record<string, HTMLElement>>({})
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
  // 新添加的卡片展开
  const idx = model.value[button.key].length - 1
  if (!expandStates[button.key]) expandStates[button.key] = {}
  expandStates[button.key][idx] = true
  // 将其他卡片折叠
  Object.keys(expandStates[button.key]).forEach((k) => {
    if (Number(k) !== idx) {
      expandStates[button.key][Number(k)] = false
    }
  })
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
}

// 拖拽结束，同步回 model
const handleDragEnd = (buttonKey: string) => {
  model.value[buttonKey] = [...(dragLists.value[buttonKey] || [])]
}

const handleEntryUpdate = (buttonKey: string, index: number, val: Record<string, any>) => {
  const list = [...(model.value[buttonKey] || [])]
  list[index] = val
  model.value[buttonKey] = list
  dragLists.value[buttonKey] = list
}

// 切换卡片折叠
const toggleExpand = (buttonKey: string, index: number) => {
  if (!expandStates[buttonKey]) expandStates[buttonKey] = {}
  expandStates[buttonKey][index] = !expandStates[buttonKey][index]
}

// 是否有任何已添加的条目
const hasEntries = computed(() => {
  return Object.values(model.value).some((list) => list && list.length > 0)
})

// 初始化第一个有数据的 tab
if (!activeTab.value && props.buttons.length > 0) {
  activeTab.value = props.buttons[0].key
}

// 为每个按钮类型设置拖拽
const setDragEl = (buttonKey: string) => (el: any) => {
  if (el && !dragEls.value[buttonKey]) {
    dragEls.value[buttonKey] = el
    dragLists.value[buttonKey] = model.value[buttonKey] || []
    useDraggable(el, dragLists.value[buttonKey], {
      animation: 150,
      handle: '.drag-handle',
      onEnd: () => {
        handleDragEnd(buttonKey)
      },
    })
  }
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

    <!-- 无内容时隐藏 tabs -->
    <template v-if="hasEntries">
      <!-- 使用 t-tabs 区分按钮类型 -->
      <t-tabs v-model="activeTab" :placement="buttons.length <= 3 ? 'top' : 'left'" size="medium">
        <t-tab-panel
          v-for="btn in buttons"
          :key="btn.key"
          :value="btn.key"
          :label="`${btn.label} (${(model[btn.key] || []).length})`"
          :disabled="!(model[btn.key] || []).length"
        >
          <!-- 可拖拽排序的卡片列表 -->
          <div :ref="setDragEl(btn.key)" class="space-y-3">
            <div
              v-for="(entry, idx) in dragLists[btn.key] || []"
              :key="`${btn.key}-${idx}`"
              class="border border-solid border-[#dfe1e6] rounded-lg overflow-hidden"
            >
              <!-- 卡片头：拖拽把手 + 标题 + 展开/折叠 + 删除 -->
              <div
                class="flex items-center gap-2 px-4 py-2 bg-[#f5f6f8] border-b border-solid border-[#dfe1e6] cursor-pointer select-none"
                @click="toggleExpand(btn.key, idx)"
              >
                <t-icon name="move" class="drag-handle text-[#86909c] cursor-grab active:cursor-grabbing flex-none" />
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
              <!-- 卡片内容 -->
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
</style>
