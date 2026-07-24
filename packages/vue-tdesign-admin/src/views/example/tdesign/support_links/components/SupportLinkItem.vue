<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import SupportLinkForm from './SupportLinkForm.vue'
import type { SupportLinkItem } from './SupportLinkForm.vue'

const props = withDefaults(defineProps<{
  item: SupportLinkItem
  index: number
  tabLabel: string
}>(), {
  tabLabel: '快速链接',
})

const emit = defineEmits<{
  update: [index: number, field: string, value: any]
  remove: [index: number]
}>()

const expanded = ref(false)
const itemRef = ref<HTMLElement | null>(null)
const formCompRef = ref<InstanceType<typeof SupportLinkForm> | null>(null)

function toggleExpand() {
  expanded.value = !expanded.value
}

function onFieldUpdate(index: number, field: string, value: any) {
  emit('update', index, field, value)
}

function handleRemove() {
  emit('remove', props.index)
}

async function validate(): Promise<boolean> {
  expanded.value = true
  await nextTick()
  const valid = await formCompRef.value!.validate()
  if (!valid) {
    await nextTick()
    itemRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  return valid
}

defineExpose({ validate })

const titleDisplay = computed(() => {
  if (props.item.isNew) {
    return `新增${props.tabLabel}`
  }
  return props.item.title || `新增${props.tabLabel}`
})
</script>

<template>
  <div
    ref="itemRef"
    style="
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 12px;
      background: #fff;
      overflow: hidden;
    "
  >
    <div
      style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        cursor: pointer;
        user-select: none;
      "
      @click="toggleExpand"
    >
      <span style="font-size: 14px; font-weight: 500; color: #999; margin-right: 8px; flex-shrink: 0;">#{{ props.index + 1 }}</span>
      <span style="font-size: 14px; font-weight: 500; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">{{ titleDisplay }}</span>
      <t-button variant="text" size="small">
        <template #icon>
          <t-icon :name="expanded ? 'chevron-up' : 'chevron-down'" />
        </template>
        {{ expanded ? '收缩' : '展开' }}
      </t-button>
    </div>

    <div v-if="expanded" style="padding: 16px; border-top: 1px solid #f0f0f0;">
      <SupportLinkForm
        ref="formCompRef"
        :item="item"
        :index="index"
        @update="onFieldUpdate"
      />

      <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
        <t-popconfirm content="确定要移除该项吗？" @confirm="handleRemove">
          <t-button theme="danger" variant="outline">移除</t-button>
        </t-popconfirm>
      </div>
    </div>
  </div>
</template>
