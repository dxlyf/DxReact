<template>
  <div class="json-editor-demo">
    <h1>JSON Schema Editor Demo</h1>
    <p class="description">基于 TDesign Vue Next 实现的 JSON Schema 表单编辑器</p>

    <div class="demo-container">
      <div class="demo-main">
        <JsonEditor
          ref="editorRef"
          :schema="currentSchema"
          v-model="formData"
          :theme="theme"
          :show-preview="showPreview"
          :show-actions="showActions"
          :validate-on-change="validateOnChange"
          @submit="handleSubmit"
          @validate="handleValidate"
        />
      </div>

      <div class="demo-sidebar">
        <t-card title="示例 Schema" :bordered="true">
          <t-space direction="vertical" style="width: 100%">
            <t-button
              v-for="example in examples"
              :key="example.name"
              block
              variant="outline"
              @click="loadExample(example)"
            >
              {{ example.name }}
            </t-button>
          </t-space>
        </t-card>

        <t-card title="配置选项" :bordered="true" style="margin-top: 16px">
          <t-space direction="vertical" style="width: 100%">
            <t-checkbox v-model="showPreview">显示 JSON 预览</t-checkbox>
            <t-checkbox v-model="showActions">显示操作按钮</t-checkbox>
            <t-checkbox v-model="validateOnChange">实时验证</t-checkbox>
          </t-space>
        </t-card>

        <t-card title="主题配置" :bordered="true" style="margin-top: 16px">
          <t-space direction="vertical" style="width: 100%">
            <t-select v-model="labelAlign" label="标签对齐">
              <t-option value="right" label="右对齐" />
              <t-option value="left" label="左对齐" />
              <t-option value="top" label="顶部对齐" />
            </t-select>
            <t-input v-model="labelWidth" label="标签宽度" placeholder="如: 100px" />
          </t-space>
        </t-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { JsonEditor, Theme, type JsonSchema } from './index'
import { MessagePlugin } from 'tdesign-vue-next'

const editorRef = ref<InstanceType<typeof JsonEditor>>()
const formData = ref<Record<string, unknown>>({})
const showPreview = ref(true)
const showActions = ref(true)
const validateOnChange = ref(true)
const labelAlign = ref<'left' | 'right' | 'top'>('right')
const labelWidth = ref('100px')

const theme = computed(() => new Theme({
  labelAlign: labelAlign.value,
  labelWidth: labelWidth.value
}))

const contactSchema: JsonSchema = {
  title: '联系表单',
  description: '请填写您的联系信息',
  type: 'object',
  required: ['name', 'email', 'message'],
  properties: {
    name: {
      title: '姓名',
      type: 'string',
      minLength: 1,
      maxLength: 50,
      description: '请输入您的姓名'
    },
    email: {
      title: '邮箱',
      type: 'string',
      format: 'email',
      minLength: 3,
      description: '请输入有效的邮箱地址'
    },
    phone: {
      title: '电话',
      type: 'string',
      pattern: '^1[3-9]\\d{9}$',
      description: '请输入11位手机号码'
    },
    message: {
      title: '留言',
      type: 'string',
      'x-format': 'textarea',
      minLength: 10,
      maxLength: 500,
      description: '请输入您的留言内容'
    },
    gdpr: {
      title: '我已阅读并接受隐私政策',
      type: 'boolean',
      const: true,
      'x-format': 'checkbox',
      default: false
    }
  }
}

const userSchema: JsonSchema = {
  title: '用户信息',
  type: 'object',
  required: ['username', 'age'],
  properties: {
    username: {
      title: '用户名',
      type: 'string',
      minLength: 3,
      maxLength: 20
    },
    password: {
      title: '密码',
      type: 'string',
      format: 'password',
      minLength: 6,
      description: '密码至少6位'
    },
    age: {
      title: '年龄',
      type: 'integer',
      minimum: 0,
      maximum: 150,
      description: '请输入您的年龄'
    },
    gender: {
      title: '性别',
      type: 'string',
      enum: ['男', '女', '其他'],
      default: '男'
    },
    email: {
      title: '邮箱',
      type: 'string',
      format: 'email'
    },
    website: {
      title: '个人网站',
      type: 'string',
      format: 'uri'
    },
    avatar: {
      title: '头像颜色',
      type: 'string',
      format: 'color',
      default: '#1890ff'
    }
  }
}

const productSchema: JsonSchema = {
  title: '产品信息',
  type: 'object',
  required: ['name', 'price'],
  properties: {
    name: {
      title: '产品名称',
      type: 'string',
      minLength: 1
    },
    price: {
      title: '价格',
      type: 'number',
      minimum: 0,
      multipleOf: 0.01
    },
    stock: {
      title: '库存',
      type: 'integer',
      minimum: 0
    },
    category: {
      title: '分类',
      type: 'string',
      enum: ['电子产品', '服装', '食品', '图书', '其他']
    },
    tags: {
      title: '标签',
      type: 'array',
      items: {
        type: 'string'
      },
      minItems: 1,
      maxItems: 5
    },
    isActive: {
      title: '是否上架',
      type: 'boolean',
      'x-format': 'switch',
      default: true
    },
    description: {
      title: '产品描述',
      type: 'string',
      'x-format': 'textarea'
    }
  }
}

const addressSchema: JsonSchema = {
  title: '地址信息',
  type: 'object',
  required: ['province', 'city', 'detail'],
  properties: {
    province: {
      title: '省份',
      type: 'string',
      enum: ['北京市', '上海市', '广东省', '浙江省', '江苏省', '其他']
    },
    city: {
      title: '城市',
      type: 'string',
      minLength: 1
    },
    district: {
      title: '区县',
      type: 'string'
    },
    detail: {
      title: '详细地址',
      type: 'string',
      'x-format': 'textarea',
      minLength: 5
    },
    postalCode: {
      title: '邮政编码',
      type: 'string',
      pattern: '^\\d{6}$'
    },
    isDefault: {
      title: '设为默认地址',
      type: 'boolean',
      'x-format': 'checkbox',
      default: false
    }
  }
}

const complexSchema: JsonSchema = {
  title: '复杂表单示例',
  type: 'object',
  required: ['basicInfo'],
  properties: {
    basicInfo: {
      title: '基本信息',
      type: 'object',
      properties: {
        name: {
          title: '姓名',
          type: 'string'
        },
        age: {
          title: '年龄',
          type: 'integer',
          minimum: 0
        },
        gender: {
          title: '性别',
          type: 'string',
          enum: ['男', '女']
        }
      }
    },
    contacts: {
      title: '联系方式',
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: {
            title: '类型',
            type: 'string',
            enum: ['手机', '邮箱', '微信']
          },
          value: {
            title: '号码',
            type: 'string'
          },
          isPrimary: {
            title: '主要联系方式',
            type: 'boolean',
            'x-format': 'checkbox'
          }
        }
      },
      minItems: 1,
      maxItems: 5
    },
    education: {
      title: '教育经历',
      type: 'array',
      items: {
        type: 'object',
        properties: {
          school: {
            title: '学校',
            type: 'string'
          },
          degree: {
            title: '学位',
            type: 'string',
            enum: ['高中', '专科', '本科', '硕士', '博士']
          },
          startDate: {
            title: '开始时间',
            type: 'string',
            format: 'date'
          },
          endDate: {
            title: '结束时间',
            type: 'string',
            format: 'date'
          }
        }
      }
    },
    skills: {
      title: '技能',
      type: 'array',
      items: {
        type: 'string'
      }
    },
    agree: {
      title: '我确认以上信息真实有效',
      type: 'boolean',
      const: true,
      'x-format': 'checkbox'
    }
  }
}

const examples = [
  { name: '联系表单', schema: contactSchema },
  { name: '用户信息', schema: userSchema },
  { name: '产品信息', schema: productSchema },
  { name: '地址信息', schema: addressSchema },
  { name: '复杂表单', schema: complexSchema }
]

const currentSchema = ref<JsonSchema>(contactSchema)

function loadExample(example: { name: string; schema: JsonSchema }) {
  currentSchema.value = example.schema
  formData.value = {}
  MessagePlugin.success(`已加载示例: ${example.name}`)
}

function handleSubmit(value: Record<string, unknown>) {
  console.log('提交数据:', value)
  MessagePlugin.success('表单提交成功！')
}

function handleValidate(errors: unknown[], value: Record<string, unknown>) {
  console.log('验证结果:', { errors, value })
}
</script>

<style scoped>
.json-editor-demo {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.json-editor-demo h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.description {
  margin: 0 0 24px 0;
  color: var(--td-text-color-secondary);
}

.demo-container {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
}

.demo-main {
  min-width: 0;
}

.demo-sidebar {
  display: flex;
  flex-direction: column;
}

@media (max-width: 900px) {
  .demo-container {
    grid-template-columns: 1fr;
  }
}
</style>
