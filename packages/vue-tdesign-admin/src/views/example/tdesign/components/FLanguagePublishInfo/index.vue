<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import { useLang } from '@/hooks/useLang'

type LangPublishInfo = {
  status: string
  onlineTime: string
  offlineTime: string
}

type Props = {
  statusRequired?: boolean
  onlineTimeRequired?: boolean
  offlineTimeRequired?: boolean
  bordered?: boolean
  headerBg?: boolean
  namePrefix?: string
}

const props = withDefaults(defineProps<Props>(), {
  statusRequired: false,
  onlineTimeRequired: false,
  offlineTimeRequired: false,
  bordered: false,
  headerBg: false,
  namePrefix: 'publishInfo',
})

const [allLang] = useLang()

const model = defineModel<Record<string, LangPublishInfo>>({
  default: () => ({}),
})

const statusOptions = [
  { label: '草稿', value: '草稿' },
  { label: '已发布', value: '已发布' },
]

const fieldRules = computed(() => {
  const r: Record<string, any[]> = {}
  allLang.value.forEach((item) => {
    const rules: Record<string, any[]> = {}

    if (props.onlineTimeRequired) {
      rules.onlineTime = [{ required: true, message: `请选择${item.label}上线时间` }]
    }
    if (props.offlineTimeRequired) {
      rules.offlineTime = [{ required: true, message: `请选择${item.label}下线时间` }]
    }

    // 交叉校验：上线时间不能晚于下线时间，下线时间不能早于上线时间
    rules.onlineTime = [
      ...(rules.onlineTime || []),
      {
        validator: (val: string) => {
          const data = model.value[item.value]
          if (!data) return true
          const offlineVal = data.offlineTime
          if (!val || !offlineVal) return true
          return dayjs(val).isBefore(dayjs(offlineVal)) || dayjs(val).isSame(dayjs(offlineVal))
        },
        message: `上线时间不能晚于下线时间`,
      },
    ]
    rules.offlineTime = [
      ...(rules.offlineTime || []),
      {
        validator: (val: string) => {
          const data = model.value[item.value]
          if (!data) return true
          const onlineVal = data.onlineTime
          if (!val || !onlineVal) return true
          return dayjs(val).isAfter(dayjs(onlineVal)) || dayjs(val).isSame(dayjs(onlineVal))
        },
        message: `下线时间不能早于上线时间`,
      },
    ]

    r[`${item.value}.onlineTime`] = rules.onlineTime
    r[`${item.value}.offlineTime`] = rules.offlineTime
  })
  return r
})

// 安全获取语言行数据，避免 model 未初始化时报错
const rowLang = (lang: string) => {
  if (!model.value[lang]) {
    model.value[lang] = { status: '草稿', onlineTime: '', offlineTime: '' }
  }
  return model.value[lang]
}

// 一键填充非英文语言的字段为英文值
const handleFillEnglish = () => {
  const enKey = 'en-US'
  const enData = model.value[enKey]
  if (!enData) return
  allLang.value.forEach((item) => {
    if (item.value === enKey) return
    const target = rowLang(item.value)
    target.status = enData.status
    target.onlineTime = enData.onlineTime
    target.offlineTime = enData.offlineTime
  })
}
</script>

<template>
  <div
    class="rounded-lg overflow-hidden bg-white"
    :class="bordered ? 'border border-solid border-[#dfe1e6]' : ''"
  >
    <div class="flex justify-between items-center pl-3 pr-[38px] py-2">
      <div></div>
      <t-button theme="primary"  size="small" @click="handleFillEnglish">一键填充英文内容</t-button>
    </div>
    <!-- Header row -->
    <div
      class="flex items-stretch text-sm font-medium text-[#4e5969]"
      :class="[
        headerBg ? 'bg-[#f5f6f8]' : '',
        bordered ? 'border-b border-solid border-[#dfe1e6]' : '',
      ]"
    >
      <div
        class="w-[100px] shrink-0 px-3 py-2 text-[#86909c]"
        :class="bordered ? 'border-r border-solid border-[#dfe1e6]' : ''"
      >语言</div>
      <div
        class="w-[240px] shrink-0 px-3 py-2"
        :class="bordered ? 'border-r border-solid border-[#dfe1e6]' : ''"
      >
        状态<span v-if="statusRequired" class="text-red-500 ml-0.5">*</span>
      </div>
      <div
        class="flex-1 px-3 py-2 min-w-0"
        :class="bordered ? 'border-r border-solid border-[#dfe1e6]' : ''"
      >
        上线时间<span v-if="onlineTimeRequired" class="text-red-500 ml-0.5">*</span>
      </div>
      <div class="flex-1 px-3 py-2 min-w-0">
        下线时间<span v-if="offlineTimeRequired" class="text-red-500 ml-0.5">*</span>
      </div>
    </div>
    <!-- Body rows -->
    <div
      v-for="(item, idx) in allLang"
      :key="item.value"
      class="flex items-stretch text-sm body-row"
      :class="bordered && idx < allLang.length - 1 ? 'border-b border-solid border-[#dfe1e6]' : ''"
    >
      <div
        class="cell cell-lang text-[#86909c]"
        :class="bordered ? 'border-r border-solid border-[#dfe1e6]' : ''"
      >
        {{ item.label }}
      </div>
      <div
        class="cell cell-status"
        :class="bordered ? 'border-r border-solid border-[#dfe1e6]' : ''"
      >
        <t-form-item
          label-width="0"
          :name="`${namePrefix}.${item.value}.status`"
          class="w-full"
        >
          <t-select
            v-model="rowLang(item.value).status"
            :options="statusOptions"
            placeholder="请选择状态"
            class="w-full"
          />
        </t-form-item>
      </div>
      <div
        class="cell cell-online-time min-w-0"
        :class="bordered ? 'border-r border-solid border-[#dfe1e6]' : ''"
      >
        <t-form-item
          label-width="0"
          :name="`${namePrefix}.${item.value}.onlineTime`"
          :rules="fieldRules[`${item.value}.onlineTime`]"
          class="w-full"
        >
          <t-date-picker
            v-model="rowLang(item.value).onlineTime"
            enable-time-picker
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择上线时间"
            clearable
            class="w-full"
          />
        </t-form-item>
      </div>
      <div
        class="cell cell-offline-time min-w-0"
      >
        <t-form-item
          label-width="0"
          :name="`${namePrefix}.${item.value}.offlineTime`"
          :rules="fieldRules[`${item.value}.offlineTime`]"
          class="w-full"
        >
          <t-date-picker
            v-model="rowLang(item.value).offlineTime"
            enable-time-picker
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择下线时间"
            clearable
            class="w-full"
          />
        </t-form-item>
      </div>
    </div>
  </div>
</template>

<style scoped>
.body-row {
  display: flex;
  align-items: stretch;
}
.cell {
  display: flex;
  align-items: center;
  padding: 8px 12px 16px;
}
.cell-lang {
  width: 100px;
  flex-shrink: 0;
  padding-top: 10px;
  padding-bottom: 10px;
}
.cell-status {
  width: 240px;
  flex-shrink: 0;
}
.cell-online-time,
.cell-offline-time {
  flex: 1;
  min-width: 0;
}
/* .t-form-item {
  margin-bottom: 0 !important;
} */
</style>


