<script setup lang="ts">
import { reactive, ref } from 'vue'
import JsonForm from './components/JsonForm.vue'

const arrayFormRef = ref()
import type { ObjectFieldConfig, ArrayFieldConfig } from './types'

// ====== 对象方案（reactive 支持动态配置） ======
const objConfig = reactive({
  addProperty: true as boolean,
  defineProperty: true as boolean,
})

const objectSchema = reactive<ObjectFieldConfig>({
  valueType: 'object',
  key: 'config',
  label: '页面配置',
  fields: [
    {
      key: 'title',
      label: '页面标题',
      valueType: 'string',
      placeholder: '请输入标题',
      required: true,
      rules:[{required:true,message:'请输入标题'}],
      help: '显示在浏览器标签页和页面顶部',
    },
    {
      key: 'status',
      label: '状态',
      valueType: 'string',
      options: [
        { label: '草稿', value: 'draft' },
        { label: '已发布', value: 'published' },
        { label: '已下线', value: 'offline' },
      ],
      defaultValue: 'draft',
    },
    {
      key: 'priority',
      label: '优先级',
      valueType: 'number',
      min: 1,
      max: 10,
      step: 1,
      defaultValue: 5,
    },
    {
      key: 'enabled',
      label: '是否启用',
      valueType: 'boolean',
      defaultValue: true,
    },
    {
      key: 'banner',
      label: '横幅配置',
      valueType: 'object',
      help: '配置页面顶部横幅',
      properties: [
        { key: 'link', label: '跳转链接', valueType: 'string', placeholder: 'https://' },
        { key: 'bgColor', label: '背景色', valueType: 'string', defaultValue: '#ffffff' },
      ],
      fields: [
        { key: 'imageUrl', label: '图片地址', valueType: 'string', placeholder: '请输入图片URL' },
        { key: 'height', label: '高度(px)', valueType: 'number', defaultValue: 300, min: 100, max: 800 },
      ],
    } as ObjectFieldConfig,
    {
      key: 'faqList',
      label: 'FAQ列表',
      valueType: 'array',
      displayType: 'tabs' as 'tabs' | 'list',
      maxItems: 10,
      removable: true,
      items: {
        valueType: 'object',
        key: 'faqItem',
        displayType:'form',
        fields: [
          { key: 'question', label: '问题', valueType: 'string', placeholder: '请输入问题' },
          { key: 'answer', label: '答案', valueType: 'string', textarea: true, rows: 3, placeholder: '请输入答案' },
          { key: 'sort', label: '排序', valueType: 'number', defaultValue: 0 },
        ],
      },
    } as ArrayFieldConfig,
    {
      key: 'tags',
      label: '标签列表',
      valueType: 'array',
      displayType: 'list' as 'tabs' | 'list',
      sortable: true,
      removable: true,
      items: {
        valueType: 'object',
        key: 'tag',
        displayType:'form',
        fields: [
          { key: 'name', label: '名称', valueType: 'string', required: true },
          {
            key: 'color',
            label: '颜色',
            valueType: 'string',
            options: [
              { label: '红色', value: 'red' },
              { label: '蓝色', value: 'blue' },
              { label: '绿色', value: 'green' },
              { label: '橙色', value: 'orange' },
            ],
            defaultValue: 'blue',
          },
        ],
      },
    } as ArrayFieldConfig,
  ],
  addedProperty: true,
  defineProperty: true,
  properties: [
    { key: 'description', label: '描述', valueType: 'string', textarea: true, rows: 2 } as any,
    { key: 'author', label: '作者', valueType: 'string' } as any,
    { key: 'viewCount', label: '浏览次数', valueType: 'number', defaultValue: 0 } as any,
  ],
})

// Reactive config syncer — watch objConfig and apply to schema
import { watch } from 'vue'
watch(() => objConfig.addProperty, (v) => { objectSchema.addedProperty = v })
watch(() => objConfig.defineProperty, (v) => { objectSchema.defineProperty = v })

const faqField = objectSchema.fields![4] as ArrayFieldConfig
const tagsField = objectSchema.fields![5] as ArrayFieldConfig

// ====== 数组方案（reactive 支持动态配置） ======
const arrConfig = reactive({
  displayType: 'list' as 'tabs' | 'list',
  sortable: true,
  removable: true,
  added: true,
  maxItems: 20,
  cardAddProperty: true,
})

const arraySchema = reactive<ArrayFieldConfig>({
  valueType: 'array',
  key: 'cards',
  label: '卡片列表',
  displayType: 'list',
  maxItems: 20,
  sortable: true,
  removable: true,
  added: true,
  items: {
    valueType: 'object',
    key: 'card',
    displayType:'form',
    addedProperty:true,
    fields: [
      { key: 'title', label: '标题', valueType: 'string', required: true, placeholder: '请输入卡片标题' },
      { key: 'subtitle', label: '副标题', valueType: 'string', placeholder: '请输入副标题' },
      {
        key: 'type',
        label: '类型',
        valueType: 'string',
        options: [
          { label: '图片卡片', value: 'image' },
          { label: '视频卡片', value: 'video' },
          { label: '文本卡片', value: 'text' },
        ],
        defaultValue: 'image',
      },
      { key: 'imageUrl', label: '图片地址', valueType: 'string', placeholder: 'https://' },
      { key: 'linkUrl', label: '跳转链接', valueType: 'string', placeholder: 'https://' },
      { key: 'enabled', label: '是否启用', valueType: 'boolean', defaultValue: true },
      {
        key: 'config',
        label: '扩展配置',
        valueType: 'object',
        addedProperty: true,
        fields: [
          { key: 'width', label: '宽度', valueType: 'number', defaultValue: 300 },
          { key: 'showBadge', label: '显示角标', valueType: 'boolean', defaultValue: false },
        ],
      } as ObjectFieldConfig,
    ],
  },
})

watch(() => arrConfig.displayType, (v) => { arraySchema.displayType = v })
watch(() => arrConfig.sortable, (v) => { arraySchema.sortable = v })
watch(() => arrConfig.removable, (v) => { arraySchema.removable = v })
watch(() => arrConfig.added, (v) => { arraySchema.added = v })
watch(() => arrConfig.maxItems, (v) => { arraySchema.maxItems = v })
watch(() => arrConfig.cardAddProperty, (v) => {
  (arraySchema.items!.fields![7] as ObjectFieldConfig).addedProperty = v
})

// ====== 表单数据 ======
const objectData = reactive<any>({})
const arrayData = reactive<any>([
  {
    "title": "111",
    "subtitle": "fd",
    "type": "video",
    "imageUrl": "ffff",
    "linkUrl": "dffdf",
    "enabled": true,
    "config": {
      "showBadge": true,
      "width": 2,
      "age": "4343"
    },
    "aa": "fdf",
    "ffff": "ffff"
  },
  {
    "title": "222",
    "subtitle": "aaa",
    "type": "image",
    "imageUrl": "",
    "linkUrl": "",
    "enabled": true,
    "config": {},
    "yyy": "bb"
  }
])

const setObjectExample = () => {
  Object.assign(objectData, {
    title: '示例页面',
    status: 'draft',
    priority: 5,
    enabled: true,
    banner: { imageUrl: 'https://example.com/banner.jpg', height: 400 },
    faqList: [
      { question: '如何退货？', answer: '联系客服申请退货。', sort: 1 },
      { question: '支付方式？', answer: '支持支付宝、微信。', sort: 2 },
    ],
    tags: [
      { name: '热门', color: 'red' },
      { name: '新品', color: 'blue' },
    ],
  })
}

const setArrayExample = () => {
  arrayData.length = 0
  arrayData.push(
    { title: '新品首发', subtitle: '2024春季新款', type: 'image', imageUrl: 'https://example.com/1.jpg', linkUrl: '', enabled: true, config: { width: 400, showBadge: true } },
    { title: '限时优惠', subtitle: '全场5折', type: 'text', imageUrl: '', linkUrl: 'https://example.com/sale', enabled: true, config: { width: 300, showBadge: false } },
    { title: '品牌故事', subtitle: '', type: 'video', imageUrl: 'https://example.com/video-cover.jpg', linkUrl: '', enabled: false, config: { width: 600, showBadge: false } },
  )
}

const clearObjectData = () => {
  Object.keys(objectData).forEach((k) => delete objectData[k])
}

const clearArrayData = () => {
  arrayData.length = 0
}

const cleanData = (data: any) => JSON.parse(JSON.stringify(data, (key, val) => {
  if (key === '_extraFields' || key === '_extraFieldTypes') return undefined
  return val
}))

const objFormRef = ref()
const handleObjectSubmit = async () => {
  const result = await objFormRef.value?.validate()
  if (result === true) {
    const clean = cleanData(objectData)
    alert(JSON.stringify(clean, null, 2))
  }
}

const handleArraySubmit = async () => {
  const result = await arrayFormRef.value?.validate()
  if (result === true) {
    const clean = cleanData(arrayData)
    alert(JSON.stringify(clean, null, 2))
  }
}
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto flex flex-col gap-6">
    <!-- ====== 方案一：对象 Schema ====== -->
    <t-card title="方案一：对象 Schema（object）">
      <template #actions>
        <div class="flex gap-2">
          <t-button variant="outline" size="small" @click="setObjectExample">填充示例</t-button>
          <t-button variant="outline" size="small" @click="clearObjectData">清空</t-button>
        </div>
      </template>

      <!-- 动态配置面板 -->
      <div class="config-panel mb-4 p-3 border border-[#dfe1e6] rounded-lg bg-[#f5f6f8]">
        <div class="flex flex-wrap gap-4 items-center">
          <span class="text-xs font-medium text-[#86909c]">根对象配置：</span>

          <t-checkbox v-model="objConfig.addProperty">允许添加自定义字段 (addedProperty)</t-checkbox>
          <t-checkbox v-model="objConfig.defineProperty" :disabled="!objConfig.addProperty">
            允许自定义字段名 (defineProperty)
          </t-checkbox>
        </div>

        <div class="mt-3 flex flex-wrap gap-4 items-center">
          <span class="text-xs font-medium text-[#86909c]">FAQ列表 (faqList)：</span>

          <t-radio-group v-model="faqField.displayType" variant="default-filled" size="small">
            <t-radio-button value="tabs">Tabs 模式</t-radio-button>
            <t-radio-button value="list">List 模式</t-radio-button>
          </t-radio-group>

          <t-checkbox v-model="faqField.removable">可删除 (removable)</t-checkbox>

          <div class="flex items-center gap-1">
            <span class="text-xs text-[#86909c]">maxItems:</span>
            <t-input-number
              v-model="faqField.maxItems"
              :min="1"
              :max="50"
              style="width: 80px"
              size="small"
            />
          </div>
        </div>

        <div class="mt-2 flex flex-wrap gap-4 items-center">
          <span class="text-xs font-medium text-[#86909c]">标签列表 (tags)：</span>

          <t-radio-group v-model="tagsField.displayType" variant="default-filled" size="small">
            <t-radio-button value="tabs">Tabs 模式</t-radio-button>
            <t-radio-button value="list">List 模式</t-radio-button>
          </t-radio-group>

          <t-checkbox v-model="tagsField.sortable">可排序 (sortable)</t-checkbox>
          <t-checkbox v-model="tagsField.removable">可删除 (removable)</t-checkbox>
        </div>
      </div>

      <JsonForm
        ref="objFormRef"
        :schema="objectSchema"
        :model-value="objectData"
        @update:model-value="Object.assign(objectData, $event)"
      />

      <template #footer>
        <div class="flex justify-between items-center">
          <pre class="text-xs bg-[#f5f6f8] p-2 rounded overflow-auto max-h-32 flex-1 mr-4">{{
            JSON.stringify(cleanData(objectData), null, 2)
          }}</pre>
          <t-button theme="primary" @click="handleObjectSubmit">提交</t-button>
        </div>
      </template>
    </t-card>

    <!-- ====== 方案二：数组 Schema ====== -->
    <t-card title="方案二：数组 Schema（array）">
      <template #actions>
        <div class="flex gap-2">
          <t-button variant="outline" size="small" @click="setArrayExample">填充示例</t-button>
          <t-button variant="outline" size="small" @click="clearArrayData">清空</t-button>
        </div>
      </template>

      <!-- 动态配置面板 -->
      <div class="config-panel mb-4 p-3 border border-[#dfe1e6] rounded-lg bg-[#f5f6f8]">
        <div class="flex flex-wrap gap-4 items-center">
          <span class="text-xs font-medium text-[#86909c]">数组配置：</span>

          <t-radio-group v-model="arrConfig.displayType" variant="default-filled" size="small">
            <t-radio-button value="tabs">Tabs 模式</t-radio-button>
            <t-radio-button value="list">List 模式</t-radio-button>
          </t-radio-group>

          <t-checkbox v-model="arrConfig.sortable">可排序 (sortable)</t-checkbox>
          <t-checkbox v-model="arrConfig.removable">可删除 (removable)</t-checkbox>
          <t-checkbox v-model="arrConfig.added">可添加 (added)</t-checkbox>

          <div class="flex items-center gap-1">
            <span class="text-xs text-[#86909c]">maxItems:</span>
            <t-input-number
              v-model="arrConfig.maxItems"
              :min="1"
              :max="50"
              style="width: 80px"
              size="small"
            />
          </div>
        </div>

        <div class="mt-2 flex flex-wrap gap-4 items-center">
          <span class="text-xs font-medium text-[#86909c]">内层对象 (config)：</span>
          <t-checkbox v-model="arrConfig.cardAddProperty">允许添加自定义字段 (addedProperty)</t-checkbox>
        </div>
      </div>

      <JsonForm
        ref="arrayFormRef"
        :schema="arraySchema"
        :model-value="arrayData"
        @update:model-value="arrayData.length = 0; arrayData.push(...($event || []))"
      />

      <template #footer>
        <div class="flex justify-between items-center">
          <pre class="text-xs bg-[#f5f6f8] p-2 rounded overflow-auto max-h-32 flex-1 mr-4">{{
            JSON.stringify(cleanData(arrayData), null, 2)
          }}</pre>
          <t-button theme="primary" @click="handleArraySubmit">提交</t-button>
        </div>
      </template>
    </t-card>
  </div>
</template>
