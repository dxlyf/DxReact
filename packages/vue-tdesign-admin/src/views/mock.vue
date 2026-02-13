<template>
  <div class="space-y-6">
    <h2 class="text-2xl font-bold text-gray-800">接口调试</h2>

    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex gap-4 mb-4">
        <t-select
          v-model="method"
          :options="methodOptions"
          class="!w-32"
        />
        <t-input
          v-model="url"
          placeholder="请输入接口地址"
          class="flex-1"
        />
        <t-button
          theme="primary"
          :loading="loading"
          @click="sendRequest"
        >
          发送请求
        </t-button>
      </div>

      <t-tabs v-model="activeTab" class="mb-4">
        <t-tab-panel value="headers" label="请求头">
          <div class="space-y-2">
            <div
              v-for="(header, index) in headers"
              :key="index"
              class="flex gap-2 items-center"
            >
              <t-input
                v-model="header.key"
                placeholder="Header 名称"
                class="flex-1"
              />
              <t-input
                v-model="header.value"
                placeholder="Header 值"
                class="flex-1"
              />
              <t-button
                theme="danger"
                variant="outline"
                size="small"
                @click="removeHeader(index)"
              >
                删除
              </t-button>
            </div>
            <t-button
              theme="default"
              variant="dashed"
              block
              @click="addHeader"
            >
              添加请求头
            </t-button>
          </div>
        </t-tab-panel>

        <t-tab-panel value="body" label="请求体">
          <div class="space-y-2">
            <t-radio-group v-model="bodyType">
              <t-radio value="none">无</t-radio>
              <t-radio value="json">JSON</t-radio>
              <t-radio value="form">Form Data</t-radio>
              <t-radio value="text">Text</t-radio>
            </t-radio-group>
            <t-textarea
              v-if="bodyType !== 'none'"
              v-model="body"
              :placeholder="bodyPlaceholder"
              :autosize="{ minRows: 10, maxRows: 20 }"
            />
          </div>
        </t-tab-panel>

        <t-tab-panel value="params" label="URL 参数">
          <div class="space-y-2">
            <div
              v-for="(param, index) in params"
              :key="index"
              class="flex gap-2 items-center"
            >
              <t-input
                v-model="param.key"
                placeholder="参数名"
                class="flex-1"
              />
              <t-input
                v-model="param.value"
                placeholder="参数值"
                class="flex-1"
              />
              <t-button
                theme="danger"
                variant="outline"
                size="small"
                @click="removeParam(index)"
              >
                删除
              </t-button>
            </div>
            <t-button
              theme="default"
              variant="dashed"
              block
              @click="addParam"
            >
              添加参数
            </t-button>
          </div>
        </t-tab-panel>
      </t-tabs>
    </div>

    <div v-if="response" class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-800">响应结果</h3>
        <div class="flex gap-2">
          <t-tag
            :theme="responseStatusTheme"
            class="mr-2"
          >
            {{ responseStatus }}
          </t-tag>
          <t-tag v-if="responseTime">
            耗时: {{ responseTime }}ms
          </t-tag>
        </div>
      </div>

      <t-tabs v-model="responseActiveTab">
        <t-tab-panel value="body" label="响应体">
          <div class="relative">
            <pre class="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 text-sm">{{ formattedResponse }}</pre>
            <t-button
              theme="default"
              variant="outline"
              size="small"
              class="absolute top-2 right-2"
              @click="copyResponse"
            >
              复制
            </t-button>
          </div>
        </t-tab-panel>

        <t-tab-panel value="headers" label="响应头">
          <div class="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
            <div
              v-for="(value, key) in responseHeaders"
              :key="key"
              class="py-1 border-b border-gray-200 last:border-0"
            >
              <span class="font-medium text-gray-700">{{ key }}:</span>
              <span class="text-gray-600 ml-2">{{ value }}</span>
            </div>
          </div>
        </t-tab-panel>
      </t-tabs>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-800">请求历史</h3>
        <t-button
          theme="danger"
          variant="outline"
          size="small"
          @click="clearHistory"
        >
          清空历史
        </t-button>
      </div>

      <div class="space-y-2">
        <div
          v-for="(item, index) in history"
          :key="index"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
          @click="loadFromHistory(index)"
        >
          <div class="flex items-center gap-3">
            <t-tag :theme="getMethodTheme(item.method)" size="small">
              {{ item.method }}
            </t-tag>
            <span class="text-gray-700">{{ item.url }}</span>
          </div>
          <div class="flex items-center gap-3">
            <t-tag
              :theme="item.success ? 'success' : 'danger'"
              size="small"
            >
              {{ item.status }}
            </t-tag>
            <span class="text-sm text-gray-500">{{ item.time }}</span>
            <t-button
              theme="danger"
              variant="text"
              size="small"
              @click.stop="removeHistory(index)"
            >
              删除
            </t-button>
          </div>
        </div>
        <div v-if="history.length === 0" class="text-center text-gray-500 py-8">
          暂无请求历史
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import axios from 'axios'
import {useUserStore} from '@/stores/user'
const userStore = useUserStore()
interface Header {
  key: string
  value: string
}

interface Param {
  key: string
  value: string
}

interface HistoryItem {
  method: string
  url: string
  status: number
  success: boolean
  time: string
}

const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' }
]

const method = ref('GET')
const url = ref('')
const activeTab = ref('headers')
const bodyType = ref('none')
const body = ref('')
const headers = ref<Header[]>([
  { key: 'Content-Type', value: 'application/json' }
])
const params = ref<Param[]>([])
const loading = ref(false)
const response = ref<any>(null)
const responseHeaders = ref<Record<string, string>>({})
const responseStatus = ref(0)
const responseTime = ref(0)
const responseActiveTab = ref('body')
const history = ref<HistoryItem[]>([])

const bodyPlaceholder = computed(() => {
  switch (bodyType.value) {
    case 'json':
      return '{\n  "key": "value"\n}'
    case 'form':
      return 'key1=value1&key2=value2'
    case 'text':
      return '请输入文本内容'
    default:
      return ''
  }
})

const formattedResponse = computed(() => {
  if (!response.value) return ''
  try {
    return JSON.stringify(response.value, null, 2)
  } catch {
    return response.value
  }
})

const responseStatusTheme = computed(() => {
  if (responseStatus.value >= 200 && responseStatus.value < 300) return 'success'
  if (responseStatus.value >= 300 && responseStatus.value < 400) return 'warning'
  return 'danger'
})

const getMethodTheme = (m: string) => {
  const themes: Record<string, any> = {
    GET: 'success',
    POST: 'primary',
    PUT: 'warning',
    DELETE: 'danger',
    PATCH: 'warning'
  }
  return themes[m] || 'default'
}

const addHeader = () => {
  headers.value.push({ key: '', value: '' })
}

const removeHeader = (index: number) => {
  headers.value.splice(index, 1)
}

const addParam = () => {
  params.value.push({ key: '', value: '' })
}

const removeParam = (index: number) => {
  params.value.splice(index, 1)
}

const buildHeaders = () => {
  const result: Record<string, string> = {}
  headers.value.forEach(header => {
    if (header.key) {
      result[header.key] = header.value
    }
  })
  return result
}

const buildParams = () => {
  const result: Record<string, string> = {}
  params.value.forEach(param => {
    if (param.key) {
      result[param.key] = param.value
    }
  })
  return result
}

const sendRequest = async () => {
  if (!url.value) {
    MessagePlugin.warning('请输入接口地址')
    return
  }

  loading.value = true
  const startTime = Date.now()

  try {
    const requestHeaders = buildHeaders()
    const requestParams = buildParams()
    let requestData: any = undefined

    if (bodyType.value !== 'none' && body.value) {
      if (bodyType.value === 'json') {
        try {
          requestData = JSON.parse(body.value)
        } catch {
          MessagePlugin.error('JSON 格式错误')
          loading.value = false
          return
        }
      } else if (bodyType.value === 'form') {
        const formData = new URLSearchParams()
        body.value.split('&').forEach(item => {
          const [key, value] = item.split('=')
          if (key) {
            formData.append(key, value || '')
          }
        })
        requestData = formData.toString()
      } else {
        requestData = body.value
      }
    }

    const config: any = {
      method: method.value,
      url: url.value,
      headers: requestHeaders,
      params: Object.keys(requestParams).length > 0 ? requestParams : undefined
    }

    if (['POST', 'PUT', 'PATCH'].includes(method.value) && requestData !== undefined) {
      config.data = requestData
    }

    const res = await axios(config)
    
    response.value = res.data
    responseHeaders.value = res.headers as Record<string, string>
    responseStatus.value = res.status
    responseTime.value = Date.now() - startTime

    addToHistory(true, res.status)

    MessagePlugin.success('请求成功')
  } catch (error: any) {
    response.value = error.response?.data || error.message
    responseHeaders.value = error.response?.headers || {}
    responseStatus.value = error.response?.status || 0
    responseTime.value = Date.now() - startTime

    addToHistory(false, error.response?.status || 0)

    MessagePlugin.error('请求失败')
  } finally {
    loading.value = false
  }
}

const addToHistory = (success: boolean, status: number) => {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  
  history.value.unshift({
    method: method.value,
    url: url.value,
    status,
    success,
    time
  })

  if (history.value.length > 20) {
    history.value.pop()
  }
}

const loadFromHistory = (index: number) => {
  const item = history.value[index]
  method.value = item.method
  url.value = item.url
}

const removeHistory = (index: number) => {
  history.value.splice(index, 1)
}

const clearHistory = () => {
  history.value = []
}

const copyResponse = async () => {
  try {
    await navigator.clipboard.writeText(formattedResponse.value)
    MessagePlugin.success('已复制到剪贴板')
  } catch {
    MessagePlugin.error('复制失败')
  }
}
</script>

<style scoped>
</style>
