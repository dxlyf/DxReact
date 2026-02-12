<template>
  <div class="country-publish">
    <div class="flex justify-end">
      <t-button theme="primary" @click="handleAutoFill" size="small">一键填充（英文）</t-button>
    </div>
    <div class="flex flex-col *:nth-[n+3]:mt-6 *:nth-2:mt-4">
      <div class="grid grid-cols-[100px_100px_200px_200px] text-md font-medium gap-4">
        <div class="">语言</div>
        <div class="before:content-['*'] before:text-red-500">状态</div>
        <div class="before:content-['*'] before:text-red-500">起始时间</div>
        <div class="before:content-['*'] before:text-red-500">结束时间</div>
      </div>
      <div class="grid grid-cols-[100px_100px_200px_200px]  gap-4" v-for="(lang, index) in langList" :key="lang.value">
        <div class="flex items-center">{{ lang.label }}</div>
        <div> <t-form-item :label-width="0" :name="`${prefix}.${lang.suffix}.status`">
            <t-select v-model="model[lang.suffix].status" placeholder="请选择状态">
              <t-option value="draft" label="Draft" />
              <t-option value="publish" label="Publish" />
            </t-select>
          </t-form-item></div>
        <div> <t-form-item :label-width="0" :rules="[{ required: true, message: '请选择起始时间' }]"
            :name="`${prefix}.${lang.suffix}.startTime`">
            <t-date-picker
              :disableDate="(date: any) => disableDate('before', model[lang.suffix].startTime, model[lang.suffix].endTime, date)"
              v-model="model[lang.suffix].startTime" placeholder="请选择起始时间" enable-time-picker
              format="YYYY-MM-DD HH:mm:ss" />
          </t-form-item></div>
        <div> <t-form-item :label-width="0" :rules="[{ required: true, message: '请选择结束时间' }]"
            :name="`${prefix}.${lang.suffix}.endTime`">
            <t-date-picker
              :disableDate="(date: any) => disableDate('after', model[lang.suffix].startTime, model[lang.suffix].endTime, date)"
              v-model="model[lang.suffix].endTime" placeholder="请选择结束时间" enable-time-picker
              format="YYYY-MM-DD HH:mm:ss" />
          </t-form-item></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, toRaw, watch, shallowReactive } from 'vue'
import type { FormInstanceFunctions } from 'tdesign-vue-next'
import { useLang } from '@/hooks/useLang'
import dayjs, { Dayjs } from 'dayjs'

const [langList] = useLang()
export interface LanguageItem {
  code: string
  name: string
  status: 'draft' | 'publish' | ''
  startTime: string
  endTime: string
}

interface Props {
  prefix:string
  // modelValue?: LanguageItem[]
  bordered?: boolean
}

// interface Emits {
//   (e: 'update:modelValue', value: LanguageItem[]): void
// }
const model = defineModel<Record<string, LanguageItem>>({ default: () => ({}) })

const props = withDefaults(defineProps<Props>(), {
  // modelValue: () => [],
  bordered: false,
  prefix:''
})

//const emit = defineEmits<Emits>()

const formRef = ref<FormInstanceFunctions>()


const disableDate = (type: string, start: any, end: any, date: Dayjs) => {
  if (type == 'before') {
    return dayjs(date).isBefore(dayjs(),'date')||(end&&dayjs(date).isAfter(end,'date'))
  } else if (type === 'after') {
   return dayjs(date).isBefore(dayjs(),'date')||(start&&dayjs(date).isBefore(start,'date'))
  }
  return true
}
// [
//   { code: 'en', name: 'English', status: '', startTime: '', endTime: '' },
//   { code: 'zh', name: '中文', status: '', startTime: '', endTime: '' },
//   { code: 'ja', name: '日本語', status: '', startTime: '', endTime: '' },
//   { code: 'ko', name: '한국어', status: '', startTime: '', endTime: '' },
//   { code: 'fr', name: 'Français', status: '', startTime: '', endTime: '' },
//   { code: 'de', name: 'Deutsch', status: '', startTime: '', endTime: '' },
//   { code: 'es', name: 'Español', status: '', startTime: '', endTime: '' },
//   { code: 'pt', name: 'Português', status: '', startTime: '', endTime: '' }
// ]

//const formData = reactive<Record<string, LanguageItem>>({})
const data: Record<string, LanguageItem> = reactive({})
watch(langList, () => {
  // const data:Record<string, LanguageItem>={}
  langList.value.forEach(item => {
    data[item.suffix] = {
      code: item.value,
      name: item.label,
      status: 'draft',
      startTime: undefined,
      endTime: undefined,
      ...(model.value[item.suffix] || {})
    }
  })
  model.value = data
}, {
  flush: 'pre',
  //immediate:true,
})
const handleAutoFill = () => {
  const english = model.value['en_us']
  if (english) {
    langList.value.forEach(item => {
      if (item.suffix !== 'en_us') {
        model.value[item.suffix].status = english.status
        model.value[item.suffix].startTime = english.startTime
        model.value[item.suffix].endTime = english.endTime
      }
    })
  }
}

</script>
