<script setup lang="ts">
import { reactive } from 'vue'
import JsonForm from './JsonForm.vue'
import type { FormSchema } from './types'

// ====== FAQ 示例 schema（使用 groups 结构）= ======
const faqSchema: FormSchema = {
  groups: [
    {
      label: 'FAQ',
      key: 'faq',
      fields: [
        {
          key: 'title',
          label: '标题',
          valueType: 'string',
          placeholder: '请输入FAQ标题',
        },
        {
          key: 'slug',
          label: '标识',
          valueType: 'string',
          placeholder: '请选择标识',
          options: [
            { label: '通用问题', value: 'faq-general' },
            { label: '产品问题', value: 'faq-product' },
            { label: '订单问题', value: 'faq-order' },
            { label: '售后问题', value: 'faq-after-sales' },
            { label: '其他', value: 'faq-other' },
          ],
        },
        {
          key: 'items',
          label: '问答项',
          valueType: 'array',
          arrayConfig: {
            displayType: 'list',
            item: {
              valueType: 'object',
              fields: [
                {
                  key: 'question',
                  label: '问题',
                  valueType: 'string',
                  placeholder: '请输入问题',
                },
                {
                  key: 'answer',
                  label: '答案',
                  valueType: 'string',
                  placeholder: '请输入答案',
                  stringConfig: { textarea: true, rows: 3 },
                },
              ],
              extraFieldTemplates: [
                { label: '排序', key: 'sort', valueType: 'number', defaultValue: 0 },
                {
                  label: '状态', key: 'status', valueType: 'string',
                  options: [
                    { label: '启用', value: 'enabled' },
                    { label: '禁用', value: 'disabled' },
                  ],
                  defaultValue: 'enabled',
                },
                { label: '备注', key: 'remark', valueType: 'string', stringConfig: { textarea: true, rows: 2 } },
                { label: '是否置顶', key: 'isTop', valueType: 'boolean', defaultValue: false },
              ],
            },
          },
        },
      ],
    },
  ],
}

// ====== 表单数据 ======
const formData = reactive<Record<string, any>>({})

// ====== 手动设置示例数据 ======
const setExampleData = () => {
  formData.faq_1734567890000 = {
    title: '常见问题',
    slug: 'faq-general',
    items: [
      { question: '如何退货？', answer: '请您联系客服申请退货，我们会在 7 个工作日内处理。' },
      { question: '支付方式有哪些？', answer: '我们支持支付宝、微信支付、银行卡等多种支付方式。' },
    ],
  }
  formData._groupInstances = ['faq_1734567890000']
  formData.faq_1734567890001 = {
    title: '售后政策',
    slug: 'faq-after-sales',
    items: [],
  }
  formData._groupInstances = ['faq_1734567890000', 'faq_1734567890001']
}

// ====== 清空数据 ======
const clearData = () => {
  Object.keys(formData).forEach((k) => delete formData[k])
}

// ====== 提交 ======
const handleSubmit = () => {
  alert(JSON.stringify(formData, null, 2))
}
</script>

<template>
  <div class="p-6 max-w-3xl mx-auto">
    <t-card title="JsonForm 组件测试 - 分组示例" class="mb-6">
      <template #actions>
        <div class="flex gap-2">
          <t-button variant="outline" size="small" @click="setExampleData">填充示例</t-button>
          <t-button variant="outline" size="small" @click="clearData">清空</t-button>
        </div>
      </template>

      <JsonForm
        :schema="faqSchema"
        :model-value="formData"
        @update:model-value="Object.assign(formData, $event)"
        @change="(val: any) => console.log('change', val)"
      />

      <template #footer>
        <div class="flex justify-end gap-2 pt-4 border-t border-solid border-[#e8e8e8]">
          <t-button @click="handleSubmit">提交（打印JSON）</t-button>
        </div>
      </template>
    </t-card>

    <t-card title="当前数据 (JSON Preview)">
      <pre class="text-sm bg-[#f5f6f8] p-4 rounded-lg overflow-auto max-h-96">{{ JSON.stringify(formData, null, 2) }}</pre>
    </t-card>
  </div>
</template>
