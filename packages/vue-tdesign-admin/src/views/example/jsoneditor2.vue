<template>
  <div class="app">
    <h1>JSON Schema 表单编辑器</h1>
    <div class="editor-container">
      <div class="schema-editor">
        <h3>Schema 定义：</h3>
        <textarea v-model="schemaText" @input="updateSchema" class="schema-textarea"></textarea>
      </div>
      
      <div class="form-editor">
        <JsonSchemaForm
          v-if="schema"
          :schema="schema"
          v-model="formData"
          @submit="handleSubmit"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import JsonSchemaForm from '@/components/json-editor2/JsonSchemaForm.vue'

// 默认的JSON Schema
const defaultSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      title: '姓名',
      description: '请输入您的姓名',
      minLength: 2,
      maxLength: 50
    },
    age: {
      type: 'integer',
      title: '年龄',
      description: '请输入年龄',
      minimum: 0,
      maximum: 150
    },
    email: {
      type: 'string',
      title: '邮箱',
      format: 'email',
      pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
    },
    isStudent: {
      type: 'boolean',
      title: '是否为学生'
    },
    hobbies: {
      type: 'array',
      title: '兴趣爱好',
      items: {
        type: 'string'
      }
    },
    address: {
      type: 'object',
      title: '地址',
      properties: {
        city: {
          type: 'string',
          title: '城市'
        },
        street: {
          type: 'string',
          title: '街道'
        }
      }
    }
  },
  required: ['name', 'email']
}

const schema = ref(defaultSchema)
const schemaText = ref(JSON.stringify(defaultSchema, null, 2))
const formData = ref({
  name: '',
  age: 25,
  email: '',
  isStudent: false,
  hobbies: [],
  address: {
    city: '',
    street: ''
  }
})

// 更新Schema
function updateSchema() {
  try {
    schema.value = JSON.parse(schemaText.value)
  } catch (error) {
    console.error('Invalid JSON Schema:', error)
  }
}

// 处理表单提交
function handleSubmit(data) {
  console.log('表单数据:', data)
  alert('表单提交成功！查看控制台输出')
}

onMounted(() => {
  // 可以在这里加载远程schema
})
</script>

<style>
.app {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.editor-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

.schema-editor,
.form-editor {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
}

.schema-textarea {
  width: 100%;
  height: 400px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  resize: vertical;
}

h1, h3 {
  color: #333;
  margin-bottom: 20px;
}
</style>