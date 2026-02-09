<template>
  <div class="country-publish">
    <div class="header-actions">
      <t-button theme="primary" @click="fillFromEnglish">一键填充（英文）</t-button>
    </div>
    
    <t-form :data="formData" :rules="rules" ref="formRef">
      <div class="grid-container" :class="{ 'no-border': !bordered }">
        <div class="grid-header">
          <div class="grid-cell">语言</div>
          <div class="grid-cell">状态</div>
          <div class="grid-cell">起始时间</div>
          <div class="grid-cell">结束时间</div>
        </div>
        
        <div 
          v-for="lang in formData.languages" 
          :key="lang.code" 
          class="grid-row"
        >
          <div class="grid-cell">{{ lang.name }}</div>
          
          <div class="grid-cell">
            <t-form-item :name="`languages.${lang.code}.status`">
              <t-select v-model="lang.status" placeholder="请选择状态">
                <t-option value="draft" label="Draft" />
                <t-option value="publish" label="Publish" />
              </t-select>
            </t-form-item>
          </div>
          
          <div class="grid-cell">
            <t-form-item :name="`languages.${lang.code}.startTime`">
              <t-date-picker
                v-model="lang.startTime"
                placeholder="请选择起始时间"
                enable-time-picker
                format="YYYY-MM-DD HH:mm:ss"
              />
            </t-form-item>
          </div>
          
          <div class="grid-cell">
            <t-form-item :name="`languages.${lang.code}.endTime`">
              <t-date-picker
                v-model="lang.endTime"
                placeholder="请选择结束时间"
                enable-time-picker
                format="YYYY-MM-DD HH:mm:ss"
              />
            </t-form-item>
          </div>
        </div>
      </div>
    </t-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { FormInstanceFunctions } from 'tdesign-vue-next'

export interface LanguageItem {
  code: string
  name: string
  status: 'draft' | 'publish' | ''
  startTime: string
  endTime: string
}

export interface CountryPublishData {
  languages: LanguageItem[]
}

interface Props {
  modelValue?: CountryPublishData
  bordered?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: CountryPublishData): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    languages: []
  }),
  bordered: true
})

const emit = defineEmits<Emits>()

const formRef = ref<FormInstanceFunctions>()

const defaultLanguages: LanguageItem[] = [
  { code: 'en', name: 'English', status: '', startTime: '', endTime: '' },
  { code: 'zh', name: '中文', status: '', startTime: '', endTime: '' },
  { code: 'ja', name: '日本語', status: '', startTime: '', endTime: '' },
  { code: 'ko', name: '한국어', status: '', startTime: '', endTime: '' },
  { code: 'fr', name: 'Français', status: '', startTime: '', endTime: '' },
  { code: 'de', name: 'Deutsch', status: '', startTime: '', endTime: '' },
  { code: 'es', name: 'Español', status: '', startTime: '', endTime: '' },
  { code: 'pt', name: 'Português', status: '', startTime: '', endTime: '' }
]

const formData = reactive<CountryPublishData>({
  languages: props.modelValue?.languages?.length ? props.modelValue.languages : [...defaultLanguages]
})

const rules = computed(() => {
  const languageRules: Record<string, any> = {}
  
  formData.languages.forEach(lang => {
    languageRules[`languages.${lang.code}.status`] = [
      { required: true, message: '请选择状态', type: 'error', trigger: 'change' }
    ]
    languageRules[`languages.${lang.code}.startTime`] = [
      { required: true, message: '请选择起始时间', type: 'error', trigger: 'change' }
    ]
    languageRules[`languages.${lang.code}.endTime`] = [
      { required: true, message: '请选择结束时间', type: 'error', trigger: 'change' }
    ]
  })
  
  return languageRules
})

const fillFromEnglish = () => {
  const englishItem = formData.languages.find(item => item.code === 'en')
  
  if (!englishItem) {
    return
  }
  
  if (!englishItem.status && !englishItem.startTime && !englishItem.endTime) {
    return
  }
  
  formData.languages.forEach(item => {
    if (item.code !== 'en') {
      item.status = englishItem.status
      item.startTime = englishItem.startTime
      item.endTime = englishItem.endTime
    }
  })
  
  emit('update:modelValue', { ...formData })
}

const validate = async () => {
  try {
    const result = await formRef.value?.validate()
    return result === true
  } catch (error) {
    return false
  }
}

const reset = () => {
  formData.languages = [...defaultLanguages]
  formRef.value?.reset()
}

defineExpose({
  validate,
  reset
})
</script>

<style scoped>
.country-publish {
  display: flex;
  flex-direction: column;
}

.country-publish .header-actions {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-end;
}

.country-publish .grid-container {
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-default);
  overflow: hidden;
}

.country-publish .grid-container.no-border {
  border: none;
}

.country-publish .grid-header {
  display: grid;
  grid-template-columns: 150px 200px 1fr 1fr;
  background-color: var(--td-bg-color-container);
  border-bottom: 1px solid var(--td-component-border);
}

.country-publish .grid-header .grid-cell {
  padding: 12px 16px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  border-right: 1px solid var(--td-component-border);
}

.country-publish .grid-header .grid-cell:last-child {
  border-right: none;
}

.country-publish .grid-container.no-border .grid-header .grid-cell {
  border-right: none;
}

.country-publish .grid-row {
  display: grid;
  grid-template-columns: 150px 200px 1fr 1fr;
  border-bottom: 1px solid var(--td-component-border);
}

.country-publish .grid-row:last-child {
  border-bottom: none;
}

.country-publish .grid-row .grid-cell {
  padding: 8px 16px;
  display: flex;
  align-items: center;
  border-right: 1px solid var(--td-component-border);
  background-color: var(--td-bg-color-container-hover);
}

.country-publish .grid-row .grid-cell:last-child {
  border-right: none;
}

.country-publish .grid-container.no-border .grid-row .grid-cell {
  border-right: none;
}

.country-publish .grid-container.no-border .grid-row {
  border-bottom: none;
}

.country-publish :deep(.t-form-item) {
  width: 100%;
  margin-bottom: 0;
}
</style>
