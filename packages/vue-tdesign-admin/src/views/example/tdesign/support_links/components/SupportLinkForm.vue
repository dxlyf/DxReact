<script setup lang="ts">
import { ref, computed } from 'vue'
import type { FormInstanceFunctions } from 'tdesign-vue-next'

export interface SupportLinkItem {
  id: number
  isNew: boolean
  title: string
  type: 'relative' | 'absolute'
  link: string
  countries: string[]
  publishStatus: 'draft' | 'published'
  publishTime: string
  sortOrder: number
}

const props = withDefaults(defineProps<{
  item: SupportLinkItem
  index: number
  prefix?: string
}>(), {
  prefix: '',
})

const emit = defineEmits<{
  update: [index: number, field: string, value: any]
}>()

const formRef = ref<FormInstanceFunctions | null>(null)

function onUpdate(field: string, value: any) {
  emit('update', props.index, field, value)
}

async function validate(): Promise<boolean> {
  const result = await formRef.value!.validate()
  return result === true
}

defineExpose({ validate })

const linkTypeOptions = [
  { label: '相对链接', value: 'relative' },
  { label: '绝对链接', value: 'absolute' },
]

const publishOptions = [
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
]

const fieldName = computed(() => (key: string) =>
  props.prefix ? `${props.prefix}.${key}` : key
)
</script>

<template>
  <t-form ref="formRef" :data="item" label-align="top">
    <t-form-item
      label="标题"
      :name="fieldName('title')"
      :rules="[{ required: true, message: '请输入标题', type: 'error' }]"
    >
      <t-input
        :model-value="item.title"
        @update:model-value="(v: string) => onUpdate('title', v)"
        placeholder="请输入标题"
        :maxlength="255"
        :show-limit-number="true"
        :style="{ width: '100%' }"
      />
    </t-form-item>

    <t-row :gutter="16">
      <t-col :span="6">
        <t-form-item
          label="类型"
          :name="fieldName('type')"
          :rules="[{ required: true, message: '请选择类型', type: 'error' }]"
        >
          <t-select
            :model-value="item.type"
            @update:model-value="(v: string) => onUpdate('type', v)"
            :options="linkTypeOptions"
            placeholder="请选择类型"
            :style="{ width: '100%' }"
          />
        </t-form-item>
      </t-col>
      <t-col :span="18">
        <t-form-item
          label="链接"
          :name="fieldName('link')"
          :rules="[{ required: true, message: '请输入链接', type: 'error' }]"
        >
          <t-input
            :model-value="item.link"
            @update:model-value="(v: string) => onUpdate('link', v)"
            placeholder="请输入链接"
            :style="{ width: '100%' }"
          />
        </t-form-item>
      </t-col>
    </t-row>

    <t-form-item
      label="适用范围"
      :name="fieldName('countries')"
      :rules="[{ required: true, message: '请选择适用范围', type: 'error' }]"
    >
      <CountrySelect
        :model-value="item.countries"
        @update:model-value="(v: string[]) => onUpdate('countries', v)"
        :style="{ width: '100%' }"
      />
    </t-form-item>

    <t-row :gutter="16">
      <t-col :span="12">
        <t-form-item
          label="发布"
          :name="fieldName('publishStatus')"
          :rules="[{ required: true, message: '请选择发布状态', type: 'error' }]"
        >
          <t-select
            :model-value="item.publishStatus"
            @update:model-value="(v: string) => onUpdate('publishStatus', v)"
            :options="publishOptions"
            placeholder="请选择发布状态"
            :style="{ width: '100%' }"
          />
        </t-form-item>
      </t-col>
      <t-col :span="12">
        <t-form-item
          label="发布时间"
          :name="fieldName('publishTime')"
          :rules="[{ required: true, message: '请选择发布时间', type: 'error' }]"
        >
          <t-date-picker
            :model-value="item.publishTime"
            @update:model-value="(v: string) => onUpdate('publishTime', v)"
            enable-time-picker
            placeholder="请选择发布时间"
            :style="{ width: '100%' }"
          />
        </t-form-item>
      </t-col>
    </t-row>

    <t-form-item label="显示位置排序" :name="fieldName('sortOrder')">
      <t-input-number
        :model-value="item.sortOrder"
        @update:model-value="(v: number) => onUpdate('sortOrder', v)"
        :min="0"
        :max="9999"
        :style="{ width: '200px' }"
      />
    </t-form-item>
  </t-form>
</template>
