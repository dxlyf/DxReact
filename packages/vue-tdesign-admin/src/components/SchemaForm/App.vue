<!--
  App.vue
  作用：SchemaForm 的完整使用示例。
  - 复杂 schema：「基本信息」卡片 + 「地址信息」卡片（含条件显隐）+ 「联系人列表」卡片（列表项内嵌「紧急联系人」列表）
  - 底部实时展示数据（JSON.stringify）
  - 按钮：校验并提交 / 重置 / 填充示例数据
  注意：真实项目中把本文件内容放入你的页面组件即可（schema + provideFormContext + FormRenderer）。
-->
<script setup lang="ts">
import { ref } from 'vue'
import type { FormModel, SchemaNode } from './types'
import { provideFormContext } from './useFormContext'
import FormRenderer from './FormRenderer.vue'

/** 表单配置：完全由 JSON 描述，可无限层级嵌套 */
const schema: SchemaNode[] = [
  {
    type: 'card',
    title: '基本信息',
    children: [
      {
        type: 'input',
        key: 'name',
        label: '姓名',
        span: 8,
        placeholder: '请输入姓名',
        rules: [{ required: true, message: '请输入姓名' }],
      },
      {
        type: 'number',
        key: 'age',
        label: '年龄',
        span: 8,
        rules: [
          { required: true, message: '请输入年龄' },
          {
            validator: (value) => (Number(value) < 18 ? '年龄需满 18 岁' : undefined),
          },
        ],
      },
      {
        type: 'select',
        key: 'gender',
        label: '性别',
        span: 8,
        defaultValue: '',
        props: {
          options: [
            { label: '男', value: 'male' },
            { label: '女', value: 'female' },
          ],
        },
      },
      { type: 'date', key: 'birthday', label: '生日', span: 8 },
      {
        type: 'textarea',
        key: 'remark',
        label: '个人简介',
        span: 24,
        props: { rows: 3 },
        rules: [{ validator: (value) => (String(value).length > 50 ? '简介不超过 50 字' : undefined) }],
      },
    ],
  },
  {
    type: 'card',
    title: '地址信息',
    children: [
      {
        type: 'select',
        key: 'contactWay',
        label: '联系方式',
        span: 8,
        defaultValue: 'phone',
        props: {
          options: [
            { label: '手机', value: 'phone' },
            { label: '邮箱', value: 'email' },
          ],
        },
      },
      // 条件显隐：字符串表达式
      {
        type: 'input',
        key: 'phone',
        label: '手机号',
        span: 8,
        visible: "model.contactWay === 'phone'",
        rules: [
          { required: true, message: '请输入手机号' },
          { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
        ],
      },
      {
        type: 'input',
        key: 'email',
        label: '邮箱',
        span: 8,
        visible: "model.contactWay === 'email'",
        rules: [
          { required: true, message: '请输入邮箱' },
          { pattern: /^[\w.-]+@[\w-]+\.[\w.]+$/, message: '邮箱格式不正确' },
        ],
      },
      { type: 'input', key: 'province', label: '省份', span: 12 },
      // 条件显隐：函数形式（填了省份才填城市）
      {
        type: 'input',
        key: 'city',
        label: '城市',
        span: 12,
        visible: (model) => Boolean(model.province),
        rules: [{ required: true, message: '请输入城市' }],
      },
      {
        type: 'textarea',
        key: 'detail',
        label: '详细地址',
        span: 24,
        visible: 'Boolean(model.city)',
      },
    ],
  },
  {
    type: 'card',
    title: '联系人列表',
    children: [
      {
        type: 'list',
        key: 'contacts',
        title: '联系人',
        addText: '添加联系人',
        itemSchema: [
          {
            type: 'grid',
            children: [
              {
                type: 'input',
                key: 'name',
                label: '联系人姓名',
                span: 8,
                rules: [{ required: true, message: '请输入联系人姓名' }],
              },
              { type: 'input', key: 'phone', label: '联系电话', span: 8 },
              {
                type: 'select',
                key: 'relation',
                label: '关系',
                span: 8,
                props: {
                  options: [
                    { label: '家人', value: 'family' },
                    { label: '朋友', value: 'friend' },
                    { label: '同事', value: 'colleague' },
                  ],
                },
              },
            ],
          },
          // 列表项内再嵌列表，形成无限层级
          {
            type: 'list',
            key: 'emergency',
            title: '紧急联系人',
            addText: '添加紧急联系人',
            itemSchema: [
              {
                type: 'grid',
                children: [
                  {
                    type: 'input',
                    key: 'name',
                    label: '紧急联系人',
                    span: 12,
                    rules: [{ required: true, message: '请输入紧急联系人姓名' }],
                  },
                  { type: 'input', key: 'phone', label: '紧急联系电话', span: 12 },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]

/** 创建并注入表单上下文，此处直接拿到 ctx 以便在页面上调用 validate / reset / setData */
const ctx = provideFormContext(schema)

const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('info')

async function handleSubmit(): Promise<void> {
  const valid = await ctx.validate()
  messageType.value = valid ? 'success' : 'error'
  message.value = valid ? '校验通过，可以提交' : '校验失败，请检查标红字段'
  if (valid) {
    console.log('提交数据：', ctx.getData())
  }
}

function handleReset(): void {
  ctx.reset()
  messageType.value = 'info'
  message.value = '已重置表单'
}

function handleFill(): void {
  // 填充示例数据：包含嵌套列表
  const example: FormModel = {
    name: '张三',
    age: 28,
    gender: 'male',
    birthday: '1997-05-20',
    remark: '前端工程师',
    contactWay: 'phone',
    phone: '13800138000',
    province: '广东省',
    city: '深圳市',
    detail: '南山区科技园 1 号',
    contacts: [
      {
        name: '李四',
        phone: '13900139000',
        relation: 'friend',
        emergency: [{ name: '王五', phone: '13700137000' }],
      },
      {
        name: '赵六',
        phone: '13600136000',
        relation: 'family',
        emergency: [],
      },
    ],
  }
  ctx.setData(example)
  messageType.value = 'info'
  message.value = '已填充示例数据'
}
</script>

<template>
  <div class="sf-demo">
    <h2 class="sf-demo__title">配置化表单生成器（SchemaForm）</h2>

    <FormRenderer :schema="schema" />

    <div class="sf-demo__actions">
      <button type="button" class="sf-demo__btn sf-demo__btn--primary" @click="handleSubmit">
        校验并提交
      </button>
      <button type="button" class="sf-demo__btn" @click="handleReset">重置</button>
      <button type="button" class="sf-demo__btn" @click="handleFill">填充示例数据</button>
      <span v-if="message" class="sf-demo__message" :class="`is-${messageType}`">{{ message }}</span>
    </div>

    <div class="sf-demo__data">
      <div class="sf-demo__data-title">实时数据</div>
      <pre class="sf-demo__data-body">{{ JSON.stringify(ctx.model, null, 2) }}</pre>
    </div>
  </div>
</template>

<style scoped>
.sf-demo {
  max-width: 1080px;
  padding: 16px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.sf-demo__title {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.sf-demo__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.sf-demo__btn {
  padding: 6px 16px;
  font-size: 13px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  color: #374151;
  cursor: pointer;
}

.sf-demo__btn:hover {
  border-color: #2563eb;
  color: #2563eb;
}

.sf-demo__btn--primary {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}

.sf-demo__btn--primary:hover {
  color: #fff;
  opacity: 0.9;
}

.sf-demo__message {
  font-size: 13px;
}

.sf-demo__message.is-success {
  color: #16a34a;
}

.sf-demo__message.is-error {
  color: #dc2626;
}

.sf-demo__message.is-info {
  color: #6b7280;
}

.sf-demo__data {
  margin-top: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.sf-demo__data-title {
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.sf-demo__data-body {
  max-height: 320px;
  padding: 12px;
  margin: 0;
  overflow: auto;
  font-size: 12px;
  line-height: 1.6;
  color: #1f2937;
  background: #fff;
}
</style>
