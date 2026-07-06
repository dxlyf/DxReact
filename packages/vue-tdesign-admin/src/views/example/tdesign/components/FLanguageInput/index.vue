<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLang } from '@/hooks/useLang'
import { useNormalizedModel } from 'src/hooks/useNormalizedModel2'

type Props = {
  type?: 'text' | 'textarea'
  placeholder?: string
  fieldProps?: Record<string, any>
  defaultValue?: any
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  defaultValue: '',
  fieldProps: () => ({}),
})

const [allLang] = useLang()
const model = defineModel<Record<string, any>>({ default: () => ({}) })

useNormalizedModel(model, {
  defaults: computed(() => {
    return allLang.value.reduce((prev, cur) => {
      prev[cur.value] = ''
      return prev
    }, {})
  }),
})

const activeTab = ref(allLang.value[0]?.value || 'zh-CN')
const expandAll = ref(false)

const currentValue = computed({
  get: () => model.value?.[activeTab.value] ?? '',
  set: (val) => {
    model.value[activeTab.value] = val
  },
})

const handleFillFromEnglish = () => {
  const enValue = model.value['en-US']
  if (!enValue && enValue !== 0) return
  allLang.value.forEach((item) => {
    if (item.value !== 'en-US') {
      model.value[item.value] = enValue
    }
  })
}

const hasValue = (lang: string) => {
  const v = model.value?.[lang]
  return v !== undefined && v !== null && v !== ''
}
</script>

<template>
  <div class="border border-solid border-[#dfe1e6] rounded-lg overflow-hidden bg-white">
    <!-- Tab bar -->
    <div class="flex items-stretch border-b border-solid border-[#dfe1e6] bg-[#f5f6f8] min-h-9">
      <template v-if="!expandAll">
        <div class="flex-1 flex items-center gap-0 overflow-x-auto flex-nowrap min-w-0 scrollbar-thin">
          <div
            v-for="(item) in allLang"
            :key="item.value"
            class="shrink-0 relative px-3 py-1.5 text-sm cursor-pointer select-none flex items-center gap-1.5 transition-colors"
            :class="[
              activeTab === item.value
                ? 'bg-white font-medium text-[#212733] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#3355ff]'
                : 'text-[#86909c] hover:text-[#4e5969] hover:bg-[#e8eaed]',
            ]"
            @click="activeTab = item.value"
          >
            {{ item.label }}
            <span
              class="inline-block w-[6px] h-[6px] rounded-full shrink-0"
              :class="hasValue(item.value) ? 'bg-[#00a854]' : 'bg-[#c9cdd4]'"
            />
          </div>
        </div>
      </template>
      <span v-else class="flex items-center px-3 py-1.5 text-sm font-medium text-[#212733] shrink-0">全部语言</span>
      <div class="flex items-center gap-0 shrink-0 pl-1 border-l border-solid border-[#dfe1e6] bg-[#f5f6f8]">
        <t-tooltip :content="expandAll ? '切换到逐个编辑' : '展开全部语言'">
          <t-button
            theme="primary"
            variant="text"
            size="small"
            class="mr-1"
            @click="expandAll = !expandAll"
          >
            <template #icon><t-icon :name="expandAll ? 'view-list' : 'bulletpoint'" /></template>
            {{ expandAll ? '逐个编辑' : '全部展开' }}
          </t-button>
        </t-tooltip>
        <t-tooltip content="将英文内容复制到所有语言">
          <t-button
            theme="primary"
            variant="text"
            size="small"
            class="mr-1"
            @click="handleFillFromEnglish"
          >
            用英文填充
          </t-button>
        </t-tooltip>
      </div>
    </div>
    <!-- Input area -->
    <div class="p-3">
      <!-- 全部展开模式 -->
      <template v-if="expandAll">
        <div
          v-for="(item) in allLang"
          :key="item.value"
          class="mb-3 last:mb-0"
        >
          <div class="text-xs text-[#86909c] mb-1 flex items-center gap-1.5">
            {{ item.label }}
            <span
              class="inline-block w-[6px] h-[6px] rounded-full"
              :class="hasValue(item.value) ? 'bg-[#00a854]' : 'bg-[#c9cdd4]'"
            />
          </div>
          <t-textarea
            v-if="type === 'textarea'"
            v-bind="fieldProps"
            v-model="model[item.value]"
            :placeholder="placeholder || `请输入${item.label}内容`"
            autosize
          />
          <t-input
            v-else
            v-bind="fieldProps"
            v-model="model[item.value]"
            :placeholder="placeholder || `请输入${item.label}内容`"
          />
        </div>
      </template>
      <!-- Tab 编辑模式 -->
      <template v-else>
        <t-textarea
          v-if="type === 'textarea'"
          v-bind="fieldProps"
          v-model="currentValue"
          :placeholder="placeholder || `请输入${allLang.find((l) => l.value === activeTab)?.label || ''}内容`"
          autosize
        />
        <t-input
          v-else
          v-bind="fieldProps"
          v-model="currentValue"
          :placeholder="placeholder || `请输入${allLang.find((l) => l.value === activeTab)?.label || ''}内容`"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.t-button--variant-text {
  color: #3355ff;
}
.scrollbar-thin::-webkit-scrollbar {
  height: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #c9cdd4;
  border-radius: 2px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #a6aab0;
}
</style>
