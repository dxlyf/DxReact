<script setup lang="ts">
import { reactive, ref, computed, toRaw, shallowRef } from 'vue'

type Props = {
  disabled?: boolean
  showTags?: boolean     // 是否显示已选标签
  maxTags?: number       // 最多显示标签数，超出显示 +N
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  showTags: true,
  maxTags: 5,
})
const model = defineModel<string[]>({ default: [] })
const selectedValues = ref<string[]>([])

const visible = shallowRef(false)

// ---- 静态国家数据 ----
type CountryItem = {
  locale: string      // 所属语言代码
  localeLabel: string // 语言中文名
  name: string        // 中文名称
  code: string        // 英文简称 (ISO 3166-1 alpha-2)
  continent: string   // 大洲
  continentLabel: string // 大洲中文名
}

const countryList: CountryItem[] = [
  // 亚洲
  { locale: 'zh', localeLabel: '中文', name: '中国', code: 'CN', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'zh', localeLabel: '中文', name: '香港', code: 'HK', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'zh', localeLabel: '中文', name: '澳门', code: 'MO', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'zh', localeLabel: '中文', name: '台湾', code: 'TW', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'ja', localeLabel: '日语', name: '日本', code: 'JP', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'ko', localeLabel: '韩语', name: '韩国', code: 'KR', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'th', localeLabel: '泰语', name: '泰国', code: 'TH', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'vi', localeLabel: '越南语', name: '越南', code: 'VN', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'ms', localeLabel: '马来语', name: '马来西亚', code: 'MY', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'id', localeLabel: '印尼语', name: '印度尼西亚', code: 'ID', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'en', localeLabel: '英语', name: '新加坡', code: 'SG', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'hi', localeLabel: '印地语', name: '印度', code: 'IN', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'ar', localeLabel: '阿拉伯语', name: '沙特阿拉伯', code: 'SA', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'he', localeLabel: '希伯来语', name: '以色列', code: 'IL', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'tr', localeLabel: '土耳其语', name: '土耳其', code: 'TR', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'fa', localeLabel: '波斯语', name: '伊朗', code: 'IR', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'fil', localeLabel: '菲律宾语', name: '菲律宾', code: 'PH', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'my', localeLabel: '缅甸语', name: '缅甸', code: 'MM', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'km', localeLabel: '高棉语', name: '柬埔寨', code: 'KH', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'lo', localeLabel: '老挝语', name: '老挝', code: 'LA', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'bn', localeLabel: '孟加拉语', name: '孟加拉国', code: 'BD', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'ne', localeLabel: '尼泊尔语', name: '尼泊尔', code: 'NP', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'si', localeLabel: '僧伽罗语', name: '斯里兰卡', code: 'LK', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'uz', localeLabel: '乌兹别克语', name: '乌兹别克斯坦', code: 'UZ', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'kk', localeLabel: '哈萨克语', name: '哈萨克斯坦', code: 'KZ', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'en', localeLabel: '英语', name: '巴基斯坦', code: 'PK', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'en', localeLabel: '英语', name: '孟加拉', code: 'BD', continent: 'asia', continentLabel: '亚洲' },
  { locale: 'en', localeLabel: '英语', name: '菲律宾', code: 'PH', continent: 'asia', continentLabel: '亚洲' },

  // 欧洲
  { locale: 'en', localeLabel: '英语', name: '英国', code: 'GB', continent: 'europe', continentLabel: '欧洲' },
  { locale: 'de', localeLabel: '德语', name: '德国', code: 'DE', continent: 'europe', continentLabel: '欧洲' },
  { locale: 'fr', localeLabel: '法语', name: '法国', code: 'FR', continent: 'europe', continentLabel: '欧洲' },
  { locale: 'it', localeLabel: '意大利语', name: '意大利', code: 'IT', continent: 'europe', continentLabel: '欧洲' },
  { locale: 'es', localeLabel: '西班牙语', name: '西班牙', code: 'ES', continent: 'europe', continentLabel: '欧洲' },
  { locale: 'pt', localeLabel: '葡萄牙语', name: '葡萄牙', code: 'PT', continent: 'europe', continentLabel: '欧洲' },
  { locale: 'nl', localeLabel: '荷兰语', name: '荷兰', code: 'NL', continent: 'europe', continentLabel: '欧洲' },
  { locale: 'sv', localeLabel: '瑞典语', name: '瑞典', code: 'SE', continent: 'europe', continentLabel: '欧洲' },
  { locale: 'no', localeLabel: '挪威语', name: '挪威', code: 'NO', continent: 'europe', continentLabel: '欧洲' },
  { locale: 'da', localeLabel: '丹麦语', name: '丹麦', code: 'DK', continent: 'europe', continentLabel: '欧洲' },
  { locale: 'fi', localeLabel: '芬兰语', name: '芬兰', code: 'FI', continent: 'europe', continentLabel: '欧洲' },
  { locale: 'pl', localeLabel: '波兰语', name: '波兰', code: 'PL', continent: 'europe', continentLabel: '欧洲' },
  { locale: 'cs', localeLabel: '捷克语', name: '捷克', code: 'CZ', continent: 'europe', continentLabel: '欧洲' },
  { locale: 'hu', localeLabel: '匈牙利语', name: '匈牙利', code: 'HU', continent: 'europe', continentLabel: '欧洲' },
  { locale: 'ro', localeLabel: '罗马尼亚语', name: '罗马尼亚', code: 'RO', continent: 'europe', continentLabel: '欧洲' },
  { locale: 'el', localeLabel: '希腊语', name: '希腊', code: 'GR', continent: 'europe', continentLabel: '欧洲' },
  { locale: 'ru', localeLabel: '俄语', name: '俄罗斯', code: 'RU', continent: 'europe', continentLabel: '欧洲' },
  { locale: 'uk', localeLabel: '乌克兰语', name: '乌克兰', code: 'UA', continent: 'europe', continentLabel: '欧洲' },
  { locale: 'hr', localeLabel: '克罗地亚语', name: '克罗地亚', code: 'HR', continent: 'europe', continentLabel: '欧洲' },
  { locale: 'sr', localeLabel: '塞尔维亚语', name: '塞尔维亚', code: 'RS', continent: 'europe', continentLabel: '欧洲' },
  { locale: 'bg', localeLabel: '保加利亚语', name: '保加利亚', code: 'BG', continent: 'europe', continentLabel: '欧洲' },
  { locale: 'sk', localeLabel: '斯洛伐克语', name: '斯洛伐克', code: 'SK', continent: 'europe', continentLabel: '欧洲' },
  { locale: 'sl', localeLabel: '斯洛文尼亚语', name: '斯洛文尼亚', code: 'SI', continent: 'europe', continentLabel: '欧洲' },
  { locale: 'lt', localeLabel: '立陶宛语', name: '立陶宛', code: 'LT', continent: 'europe', continentLabel: '欧洲' },
  { locale: 'lv', localeLabel: '拉脱维亚语', name: '拉脱维亚', code: 'LV', continent: 'europe', continentLabel: '欧洲' },
  { locale: 'et', localeLabel: '爱沙尼亚语', name: '爱沙尼亚', code: 'EE', continent: 'europe', continentLabel: '欧洲' },
  { locale: 'mt', localeLabel: '马耳他语', name: '马耳他', code: 'MT', continent: 'europe', continentLabel: '欧洲' },

  // 北美洲
  { locale: 'en', localeLabel: '英语', name: '美国', code: 'US', continent: 'northAmerica', continentLabel: '北美洲' },
  { locale: 'en', localeLabel: '英语', name: '加拿大', code: 'CA', continent: 'northAmerica', continentLabel: '北美洲' },
  { locale: 'es', localeLabel: '西班牙语', name: '墨西哥', code: 'MX', continent: 'northAmerica', continentLabel: '北美洲' },

  // 南美洲
  { locale: 'pt', localeLabel: '葡萄牙语', name: '巴西', code: 'BR', continent: 'southAmerica', continentLabel: '南美洲' },
  { locale: 'es', localeLabel: '西班牙语', name: '阿根廷', code: 'AR', continent: 'southAmerica', continentLabel: '南美洲' },
  { locale: 'es', localeLabel: '西班牙语', name: '智利', code: 'CL', continent: 'southAmerica', continentLabel: '南美洲' },
  { locale: 'es', localeLabel: '西班牙语', name: '哥伦比亚', code: 'CO', continent: 'southAmerica', continentLabel: '南美洲' },
  { locale: 'es', localeLabel: '西班牙语', name: '秘鲁', code: 'PE', continent: 'southAmerica', continentLabel: '南美洲' },
  { locale: 'es', localeLabel: '西班牙语', name: '委内瑞拉', code: 'VE', continent: 'southAmerica', continentLabel: '南美洲' },

  // 大洋洲
  { locale: 'en', localeLabel: '英语', name: '澳大利亚', code: 'AU', continent: 'oceania', continentLabel: '大洋洲' },
  { locale: 'en', localeLabel: '英语', name: '新西兰', code: 'NZ', continent: 'oceania', continentLabel: '大洋洲' },

  // 非洲
  { locale: 'en', localeLabel: '英语', name: '南非', code: 'ZA', continent: 'africa', continentLabel: '非洲' },
  { locale: 'en', localeLabel: '英语', name: '尼日利亚', code: 'NG', continent: 'africa', continentLabel: '非洲' },
  { locale: 'en', localeLabel: '英语', name: '肯尼亚', code: 'KE', continent: 'africa', continentLabel: '非洲' },
  { locale: 'fr', localeLabel: '法语', name: '摩洛哥', code: 'MA', continent: 'africa', continentLabel: '非洲' },
  { locale: 'fr', localeLabel: '法语', name: '埃及', code: 'EG', continent: 'africa', continentLabel: '非洲' },
  { locale: 'pt', localeLabel: '葡萄牙语', name: '安哥拉', code: 'AO', continent: 'africa', continentLabel: '非洲' },
]

// ---- 提取分类 ----
type ViewMode = 'continent' | 'locale'

const viewMode = ref<ViewMode>('continent')

// 去重大洲列表
const continentList = computed(() => {
  const map = new Map<string, string>()
  for (const c of countryList) {
    if (!map.has(c.continent)) {
      map.set(c.continent, c.continentLabel)
    }
  }
  return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
})

// 去重语言列表
const localeList = computed(() => {
  const map = new Map<string, string>()
  for (const c of countryList) {
    if (!map.has(c.locale)) {
      map.set(c.locale, c.localeLabel)
    }
  }
  return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
})

// 当前过滤 tab
const activeTab = ref('')

function setViewMode(mode: ViewMode) {
  viewMode.value = mode
  activeTab.value = ''
}

// 按分类过滤后的国家列表
const filteredCountries = computed(() => {
  if (!activeTab.value) return countryList
  if (viewMode.value === 'continent') {
    return countryList.filter(c => c.continent === activeTab.value)
  }
  return countryList.filter(c => c.locale === activeTab.value)
})

// 分组
function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = keyFn(item)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return map
}

const groupedCountries = computed(() => {
  if (activeTab.value) {
    // 已过滤，按当前显示模式的另一维度分组
    if (viewMode.value === 'continent') {
      return groupBy(filteredCountries.value, c => c.continent)
    }
    return groupBy(filteredCountries.value, c => c.locale)
  }
  // 未过滤，按当前显示模式分组
  if (viewMode.value === 'continent') {
    return groupBy(filteredCountries.value, c => c.continent)
  }
  return groupBy(filteredCountries.value, c => c.locale)
})

// 分组标题
function getGroupTitle(key: string): string {
  if (viewMode.value === 'continent') {
    return continentList.value.find(c => c.value === key)?.label || key
  }
  return localeList.value.find(l => l.value === key)?.label || key
}

// ---- 弹窗 ----
function handleOpen() {
  visible.value = true
  selectedValues.value = [...toRaw(model.value)]
}

function handleConfirm() {
  model.value = [...toRaw(selectedValues.value)]
  visible.value = false
}

function handleClose() {
  selectedValues.value = []
  visible.value = false
}

function handleCellClick(val: string) {
  const idx = selectedValues.value.indexOf(val)
  if (idx === -1) selectedValues.value.push(val)
  else selectedValues.value.splice(idx, 1)
}

function handleSelectAll() {
  for (const c of filteredCountries.value) {
    if (!selectedValues.value.includes(c.code)) {
      selectedValues.value.push(c.code)
    }
  }
}

function handleInvertSelect() {
  const filteredCodes = [...new Set(filteredCountries.value.map(c => c.code))]
  for (const code of filteredCodes) {
    const idx = selectedValues.value.indexOf(code)
    if (idx === -1) selectedValues.value.push(code)
    else selectedValues.value.splice(idx, 1)
  }
}

// 已选国家名称（用于标签显示）
const selectedCountryNames = computed(() => {
  return model.value.map(code => countryList.find(c => c.code === code)?.name || code)
})

const visibleTags = computed(() => {
  if (!props.showTags) return []
  return selectedCountryNames.value.slice(0, props.maxTags)
})

const extraCount = computed(() => {
  return Math.max(0, selectedCountryNames.value.length - props.maxTags)
})
</script>

<template>
  <div>
    <slot v-bind="{ onClick: handleOpen, disabled: props.disabled }">
      <t-button @click="handleOpen" theme="default" :disabled="props.disabled">
        {{ model.length > 0 ? `已选 ${model.length} 项` : '选择' }}
      </t-button>
    </slot>

    <!-- 已选国家标签 -->
    <div v-if="showTags && model.length > 0" style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;">
      <t-tag v-for="name in visibleTags" :key="name" size="small" theme="default" closable @close="model = model.filter(c => c !== countryList.find(item => item.name === name)?.code)">
        {{ name }}
      </t-tag>
      <t-tooltip v-if="extraCount > 0" :content="selectedCountryNames.slice(props.maxTags).join('、')">
        <t-tag size="small" theme="warning" style="cursor: pointer;">+{{ extraCount }}</t-tag>
      </t-tooltip>
    </div>

    <t-dialog
      attach="body"
      width="680px"
      header="选择国家"
      :visible="visible"
      @close="handleClose"
      @confirm="handleConfirm"
    >
      <!-- 显示模式切换 -->
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <t-radio-group :model-value="viewMode" @update:model-value="setViewMode">
          <t-radio-button value="continent">按大洲</t-radio-button>
          <t-radio-button value="locale">按语言</t-radio-button>
        </t-radio-group>

        <!-- 分类 tab -->
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <t-tag
            v-if="viewMode === 'continent'"
            v-for="c in continentList"
            :key="c.value"
            :theme="activeTab === c.value ? 'primary' : 'default'"
            :style="{ cursor: 'pointer' }"
            @click="activeTab = activeTab === c.value ? '' : c.value"
          >
            {{ c.label }}
          </t-tag>
          <t-tag
            v-else
            v-for="l in localeList"
            :key="l.value"
            :theme="activeTab === l.value ? 'primary' : 'default'"
            :style="{ cursor: 'pointer' }"
            @click="activeTab = activeTab === l.value ? '' : l.value"
          >
            {{ l.label }}
          </t-tag>
          <t-tag
            v-if="activeTab"
            theme="warning"
            :style="{ cursor: 'pointer' }"
            @click="activeTab = ''"
          >
            清除过滤
          </t-tag>
        </div>
      </div>

      <!-- 列表 -->
      <div style="max-height: 400px; overflow-y: auto;">
        <div v-for="[key, items] in groupedCountries" :key="key" style="margin-bottom: 16px;">
          <div style="font-size: 14px; font-weight: 600; color: #1677ff; padding: 8px 0; border-bottom: 1px solid #f0f0f0; margin-bottom: 8px;">
            {{ getGroupTitle(key) }}（{{ items.length }}）
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            <div
              v-for="c in items"
              :key="c.code"
              :style="{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: 'calc(50% - 3px)',
                padding: '6px 10px',
                border: `1px solid ${selectedValues.includes(c.code) ? '#1677ff' : '#e8e8e8'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                background: selectedValues.includes(c.code) ? '#e6f4ff' : '#fff',
                transition: 'all 0.15s',
              }"
              @click="handleCellClick(c.code)"
            >
              <div style="display: flex; align-items: center; gap: 6px;">
                <t-checkbox :checked="selectedValues.includes(c.code)" :value="c.code" @click.stop />
                <span style="font-size: 13px;">{{ c.name }}</span>
              </div>
              <span style="font-size: 11px; color: #999;">
                {{ viewMode === 'continent' ? c.localeLabel : c.continentLabel }}
              </span>
            </div>
          </div>
        </div>
        <div v-if="filteredCountries.length === 0" style="text-align: center; padding: 40px; color: #999;">
          暂无数据
        </div>
      </div>
      <template #footer>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div v-if="filteredCountries.length > 0" style="display: flex; gap: 12px;">
            <a href="javascript:;" style="font-size: 13px; color: #1677ff; text-decoration: none;" @click="handleSelectAll">全选</a>
            <a href="javascript:;" style="font-size: 13px; color: #1677ff; text-decoration: none;" @click="handleInvertSelect">反选</a>
          </div>
          <div>
            <t-button variant="outline" @click="handleClose" style="margin-right: 8px;">取消</t-button>
            <t-button theme="primary" @click="handleConfirm">确定</t-button>
          </div>
        </div>
      </template>
    </t-dialog>
  </div>
</template>
