<script setup lang="ts">
import { ref, reactive, computed, shallowRef, watch, nextTick } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import axios from 'axios'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'

// ==================== IndexedDB 封装 ====================
const DB_NAME = 'ApiTestDB'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('environments')) {
        const store = db.createObjectStore('environments', { keyPath: 'id', autoIncrement: true })
        store.createIndex('name', 'name', { unique: false })
      }
      if (!db.objectStoreNames.contains('apis')) {
        const store = db.createObjectStore('apis', { keyPath: 'id', autoIncrement: true })
        store.createIndex('envId', 'envId', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function dbGetAll<T>(storeName: string): Promise<T[]> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const req = store.getAll()
    req.onsuccess = () => { resolve(req.result); db.close() }
    req.onerror = () => { reject(req.error); db.close() }
  }))
}

function dbPut<T>(storeName: string, data: T): Promise<number> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const req = store.put(data)
    req.onsuccess = () => { resolve(req.result as number); db.close() }
    req.onerror = () => { reject(req.error); db.close() }
  }))
}

function dbDelete(storeName: string, id: number): Promise<void> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const req = store.delete(id)
    req.onsuccess = () => { resolve(); db.close() }
    req.onerror = () => { reject(req.error); db.close() }
  }))
}

// ==================== 类型定义 ====================
interface KeyValue {
  key: string
  value: string
}

interface EnvConfig {
  id?: number
  name: string
  baseURL: string
  timeout: number
  responseType: string
  headers: KeyValue[]
  /** JSON 对象字符串 */
  params: string
  /** JSON 对象字符串 */
  body: string
}

interface ApiItem {
  id?: number
  envId: number
  name: string
  method: string
  path: string
  description: string
  headers: KeyValue[]
  /** JSON 对象字符串 */
  params: string
  /** JSON 对象字符串 */
  body: string
  contentType: string
}

function defaultEnv(): EnvConfig {
  return {
    name: '开发环境',
    baseURL: 'http://localhost:3000',
    timeout: 10000,
    responseType: 'json',
    headers: [{ key: 'Content-Type', value: 'application/json' }],
    params: '{\n  \n}',
    body: '{\n  \n}',
  }
}

function defaultApi(envId: number): ApiItem {
  return {
    envId,
    name: '',
    method: 'GET',
    path: '',
    description: '',
    headers: [],
    params: '{\n  \n}',
    body: '{\n  \n}',
    contentType: 'application/json',
  }
}

// ==================== 数据状态 ====================
const environments = ref<EnvConfig[]>([])
const apis = ref<ApiItem[]>([])
const loading = ref(true)

const activeEnvId = ref<number | null>(null)
const activeApiId = ref<number | null>(null)

// Dialog
const envDialogVisible = ref(false)
const editingEnv = reactive<EnvConfig>(defaultEnv())
const isEditingEnv = ref(false)

const apiDialogVisible = ref(false)
const editingApi = reactive<ApiItem>(defaultApi(0))
const isEditingApi = ref(false)

// 右侧 tab
const rightTab = ref('params')
const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' },
]

// 当前环境
const activeEnv = computed(() => environments.value.find(e => e.id === activeEnvId.value))
const envApis = computed(() => apis.value.filter(a => a.envId === activeEnvId.value))
const activeApi = computed(() => apis.value.find(a => a.id === activeApiId.value))

// 合并后的配置（响应式，用于右侧编辑）
const mergedHeaders = ref<KeyValue[]>([])
const mergedParams = ref('')
const mergedBody = ref('')

function tryParseJson(str: string): Record<string, any> {
  try { return JSON.parse(str) || {} } catch { return {} }
}

function buildMergedConfig() {
  const env = activeEnv.value
  const api = activeApi.value
  if (!env || !api) {
    mergedHeaders.value = []
    mergedParams.value = ''
    mergedBody.value = ''
    return
  }
  // 环境公共 headers + API 自身 headers
  const hMap = new Map<string, string>()
  for (const h of env.headers) hMap.set(h.key, h.value)
  for (const h of api.headers) hMap.set(h.key, h.value)
  mergedHeaders.value = Array.from(hMap.entries()).map(([key, value]) => ({ key, value }))

  // params: 环境 + API，API 优先级高
  const mergedParamsObj = { ...tryParseJson(env.params), ...tryParseJson(api.params) }
  mergedParams.value = Object.keys(mergedParamsObj).length > 0 ? JSON.stringify(mergedParamsObj, null, 2) : '{\n  \n}'

  // body: 环境 + API，API 优先级高
  const mergedBodyObj = { ...tryParseJson(env.body), ...tryParseJson(api.body) }
  mergedBody.value = Object.keys(mergedBodyObj).length > 0 ? JSON.stringify(mergedBodyObj, null, 2) : '{\n  \n}'
}

watch([activeEnvId, activeApiId], () => {
  buildMergedConfig()
})

// ==================== 加载 & 持久化 ====================
async function loadData() {
  loading.value = true
  try {
    const [envs, apiList] = await Promise.all([
      dbGetAll<EnvConfig>('environments'),
      dbGetAll<ApiItem>('apis'),
    ])
    environments.value = envs.map(e => ({
      ...e,
      headers: Array.isArray(e.headers) ? e.headers : [],
      params: typeof e.params !== 'string' ? '{\n  \n}' : e.params,
      body: typeof e.body !== 'string' ? '{\n  \n}' : e.body,
    }))
    apis.value = apiList.map(a => ({
      ...a,
      headers: Array.isArray(a.headers) ? a.headers : [],
      params: typeof a.params !== 'string' ? '{\n  \n}' : a.params,
      body: typeof a.body !== 'string' ? '{\n  \n}' : a.body,
    }))

    if (envs.length === 0) {
      // 创建默认环境
      const id = await dbPut('environments', defaultEnv())
      environments.value = [{ ...defaultEnv(), id }]
    }
    if (activeEnvId.value === null) {
      activeEnvId.value = environments.value[0]?.id ?? null
    }
  } finally {
    loading.value = false
  }
}

async function saveEnv(env: EnvConfig) {
  if (!env.id) throw new Error('env.id required')
  await dbPut('environments', JSON.parse(JSON.stringify(env)))
}

async function saveApi(api: ApiItem) {
  if (!api.id) throw new Error('api.id required')
  await dbPut('apis', JSON.parse(JSON.stringify(api)))
}

loadData()

// ==================== 环境管理 ====================
function openAddEnv() {
  isEditingEnv.value = false
  Object.assign(editingEnv, defaultEnv())
  envDialogVisible.value = true
}

function openEditEnv() {
  const env = activeEnv.value
  if (!env) return
  isEditingEnv.value = true
  Object.assign(editingEnv, { ...env })
  envDialogVisible.value = true
}

async function handleSaveEnv() {
  if (!editingEnv.name) {
    MessagePlugin.warning('请输入环境名称')
    return
  }
  const rawEnv = JSON.parse(JSON.stringify(editingEnv))
  if (isEditingEnv.value && rawEnv.id) {
    await dbPut('environments', rawEnv)
    const idx = environments.value.findIndex(e => e.id === rawEnv.id)
    if (idx >= 0) environments.value[idx] = rawEnv
  } else {
    delete rawEnv.id
    const id = await dbPut('environments', rawEnv)
    environments.value.push({ ...rawEnv, id })
    activeEnvId.value = id
  }
  envDialogVisible.value = false
  buildMergedConfig()
}

async function handleDeleteEnv() {
  const env = activeEnv.value
  if (!env || !env.id) return
  // 删除该环境下所有 API
  const toDelete = apis.value.filter(a => a.envId === env.id)
  for (const api of toDelete) {
    if (api.id) await dbDelete('apis', api.id)
  }
  await dbDelete('environments', env.id)
  environments.value = environments.value.filter(e => e.id !== env.id)
  apis.value = apis.value.filter(a => a.envId !== env.id)

  if (environments.value.length === 0) {
    const id = await dbPut('environments', defaultEnv())
    environments.value.push({ ...defaultEnv(), id })
  }
  activeEnvId.value = environments.value[0]?.id ?? null
  activeApiId.value = null
}

function switchEnv(id: number) {
  activeEnvId.value = id
  activeApiId.value = null
}

// ==================== API 管理 ====================
function openAddApi() {
  if (!activeEnvId.value) {
    MessagePlugin.warning('请先选择环境')
    return
  }
  isEditingApi.value = false
  Object.assign(editingApi, defaultApi(activeEnvId.value))
  apiDialogVisible.value = true
}

function openEditApi() {
  const api = activeApi.value
  if (!api) return
  isEditingApi.value = true
  Object.assign(editingApi, { ...api })
  apiDialogVisible.value = true
}

async function handleSaveApi() {
  if (!editingApi.name) {
    MessagePlugin.warning('请输入 API 名称')
    return
  }
  if (!editingApi.path) {
    MessagePlugin.warning('请输入请求路径')
    return
  }
  const rawApi = JSON.parse(JSON.stringify(editingApi))
  if (isEditingApi.value && rawApi.id) {
    await dbPut('apis', rawApi)
    const idx = apis.value.findIndex(a => a.id === rawApi.id)
    if (idx >= 0) apis.value[idx] = rawApi
  } else {
    delete rawApi.id
    const id = await dbPut('apis', rawApi)
    apis.value.push({ ...rawApi, id })
    activeApiId.value = id
  }
  apiDialogVisible.value = false
  buildMergedConfig()
}

async function handleDeleteApi() {
  const api = activeApi.value
  if (!api || !api.id) return
  await dbDelete('apis', api.id)
  apis.value = apis.value.filter(a => a.id !== api.id)
  activeApiId.value = null
}

function selectApi(id: number) {
  activeApiId.value = id
}

// ==================== KV 编辑工具 ====================
function addKv(list: KeyValue[]) {
  list.push({ key: '', value: '' })
}
function removeKv(list: KeyValue[], index: number) {
  list.splice(index, 1)
}

// ==================== 发送请求 ====================
interface ResponseRecord {
  status: number
  statusText: string
  data: any
  raw: string
  duration: number
  size: string
}

const sending = ref(false)
const response = shallowRef<ResponseRecord | null>(null)

async function handleSend() {
  const env = activeEnv.value
  const api = activeApi.value
  if (!env || !api) {
    MessagePlugin.warning('请选择环境和 API')
    return
  }

  sending.value = true
  response.value = null
  const start = performance.now()
  try {
    // 构建 headers
    const headers: Record<string, string> = {}
    for (const h of mergedHeaders.value) {
      if (h.key) headers[h.key] = h.value
    }

    // 构建 URL
    let url = env.baseURL.replace(/\/+$/, '') + '/' + api.path.replace(/^\/+/, '')
    // query params: 使用右侧临时编辑的合并 params
    const qp = tryParseJson(mergedParams.value)
    const qs = new URLSearchParams(qp).toString()
    if (qs) url += (url.includes('?') ? '&' : '?') + qs

    // body: 使用右侧临时编辑的合并 body
    let data: any = undefined
    
    const bodyObj = tryParseJson(mergedBody.value)
    if (['POST', 'PUT', 'PATCH'].includes(api.method) && Object.keys(bodyObj).length > 0) {
      if (api.contentType.includes('json')) {
        data = bodyObj
      } else {
        data = new URLSearchParams(bodyObj).toString()
      }
    }

    const axiosConfig: AxiosRequestConfig = {
      url:url,
      method: api.method.toLowerCase() as any,
      headers,
      data,
      timeout: env.timeout,
      responseType: env.responseType as any,
    }

    const res = await axios.request(axiosConfig)

    const duration = performance.now() - start
    const rawStr = JSON.stringify(res.data, null, 2)
    response.value = {
      status: res.status,
      statusText: res.statusText,
      data: res.data,
      raw: rawStr,
      duration: Math.round(duration),
      size: `${(new Blob([rawStr]).size / 1024).toFixed(1)} KB`,
    }
  } catch (err: any) {
    const duration = performance.now() - start
    if (err.response) {
      const res = err.response as AxiosResponse
      const rawStr = JSON.stringify(res.data, null, 2)
      response.value = {
        status: res.status,
        statusText: res.statusText,
        data: res.data,
        raw: rawStr,
        duration: Math.round(duration),
        size: `${(new Blob([rawStr]).size / 1024).toFixed(1)} KB`,
      }
    } else {
      response.value = {
        status: 0,
        statusText: err.message || '请求失败',
        data: null,
        raw: err.message || '请求失败',
        duration: Math.round(duration),
        size: '-',
      }
    }
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div style="height: 100%; display: flex; flex-direction: column; padding: 16px; gap: 12px; box-sizing: border-box; overflow: hidden;">
    <!-- ===== 顶部环境栏 ===== -->
    <div style="display: flex; align-items: center; gap: 12px; flex-shrink: 0;">
      <div style="display: flex; align-items: center; gap: 6px;">
        <t-tag theme="primary" variant="light">环境</t-tag>
        <t-select
          v-if="environments.length > 0"
          :model-value="activeEnvId"
          @update:model-value="switchEnv"
          :options="environments.map(e => ({ label: e.name, value: e.id }))"
          style="width: 200px;"
          clearable
        />
      </div>
      <t-button size="small" variant="outline" @click="openAddEnv">添加环境</t-button>
      <t-button size="small" variant="outline" :disabled="!activeEnv" @click="openEditEnv">
        {{ activeEnv?.name || '环境配置' }}
      </t-button>
      <t-popconfirm v-if="activeEnv" content="确定删除当前环境？" @confirm="handleDeleteEnv">
        <t-button size="small" variant="outline" theme="danger">删除</t-button>
      </t-popconfirm>

      <div style="flex: 1; text-align: right; font-size: 12px; color: #999;">
        <template v-if="activeEnv">
          {{ activeEnv.baseURL }} | timeout: {{ activeEnv.timeout }}ms | responseType: {{ activeEnv.responseType }}
        </template>
      </div>
    </div>

    <!-- ===== 主体 ===== -->
    <div v-if="loading" style="flex:1;display:flex;align-items:center;justify-content:center;color:#999;">加载中...</div>
    <div v-else style="flex: 1; display: flex; gap: 12px; min-height: 0;">
      <!-- ===== 左侧 API 列表 ===== -->
      <div style="width: 280px; flex-shrink: 0; display: flex; flex-direction: column; background: #fff; border-radius: 6px; border: 1px solid #e8e8e8; overflow: hidden;">
        <div style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 600; font-size: 14px;">API 列表</span>
          <t-button size="small" variant="outline" @click="openAddApi">+ 添加</t-button>
        </div>
        <div style="flex: 1; overflow-y: auto; padding: 4px 0;">
          <div
            v-for="api in envApis"
            :key="api.id"
            :style="{
              padding: '8px 12px',
              cursor: 'pointer',
              borderLeft: `3px solid ${activeApiId === api.id ? '#1677ff' : 'transparent'}`,
              background: activeApiId === api.id ? '#e6f4ff' : 'transparent',
              transition: 'all 0.15s',
            }"
            @click="selectApi(api.id!)"
          >
            <div style="display: flex; align-items: center; gap: 6px;">
              <t-tag size="small" :theme="api.method === 'GET' ? 'primary' : api.method === 'POST' ? 'success' : 'warning'" style="font-size: 10px;">{{ api.method }}</t-tag>
              <span style="font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ api.name || api.path || '(未命名)' }}</span>
            </div>
            <div v-if="api.path" style="font-size: 11px; color: #999; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ api.path }}</div>
          </div>
          <div v-if="envApis.length === 0" style="text-align: center; padding: 40px 0; color: #ccc; font-size: 13px;">
            暂无 API，点击上方添加
          </div>
        </div>
      </div>

      <!-- ===== 右侧详情 ===== -->
      <div style="flex: 1; display: flex; flex-direction: column; min-width: 0; background: #fff; border-radius: 6px; border: 1px solid #e8e8e8; overflow: hidden;">
        <template v-if="activeApi">
          <!-- 请求栏 -->
          <div style="padding: 10px 16px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; gap: 8px;">
            <t-tag :theme="activeApi.method === 'GET' ? 'primary' : activeApi.method === 'POST' ? 'success' : 'warning'">{{ activeApi.method }}</t-tag>
            <span style="font-size: 13px; font-weight: 500; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ activeApi.name }}</span>
            <t-button size="small" variant="outline" @click="openEditApi">编辑</t-button>
            <t-popconfirm content="确定删除该 API？" @confirm="handleDeleteApi">
              <t-button size="small" variant="outline" theme="danger">删除</t-button>
            </t-popconfirm>
            <t-button theme="primary" :loading="sending" @click="handleSend">发送请求</t-button>
          </div>

          <!-- Tab 内容 -->
          <t-tabs v-model="rightTab" style="flex: 1; display: flex; flex-direction: column; min-height: 0;">
            <t-tab-panel value="params" label="基础参数" style="flex: 1; overflow-y: auto; padding: 12px;">
              <t-form label-align="top">
                <t-form-item label="名称">
                  <t-input v-model="activeApi.name" @blur="saveApi(activeApi)" />
                </t-form-item>
                <t-form-item label="请求方法">
                  <t-select v-model="activeApi.method" :options="methodOptions" style="width: 200px;" @change="saveApi(activeApi)" />
                </t-form-item>
                <t-form-item label="请求路径（相对 baseURL）">
                  <t-input v-model="activeApi.path" placeholder="/api/v1/users" @blur="saveApi(activeApi)" />
                </t-form-item>
                <t-form-item label="Content-Type">
                  <t-select
                    v-model="activeApi.contentType"
                    :options="[
                      { label: 'application/json', value: 'application/json' },
                      { label: 'application/x-www-form-urlencoded', value: 'application/x-www-form-urlencoded' },
                      { label: 'text/plain', value: 'text/plain' },
                    ]"
                    style="width: 300px;"
                    @change="saveApi(activeApi)"
                  />
                </t-form-item>
                <t-form-item label="描述">
                  <t-input v-model="activeApi.description" @blur="saveApi(activeApi)" />
                </t-form-item>
              </t-form>
            </t-tab-panel>

            <t-tab-panel value="headers" label="Headers" style="flex: 1; overflow-y: auto; padding: 12px;">
              <div style="margin-bottom: 8px; font-size: 12px; color: #999;">
                环境公共 headers + API 自身 headers，临时编辑不影响原配置
              </div>
              <div v-for="(h, i) in mergedHeaders" :key="i" style="display: flex; gap: 6px; margin-bottom: 6px; align-items: center;">
                <t-input v-model="h.key" placeholder="key" style="width: 200px;" />
                <t-input v-model="h.value" placeholder="value" style="width: 300px;" />
                <t-button size="small" variant="outline" @click="removeKv(mergedHeaders, i)">✕</t-button>
              </div>
              <t-button size="small" variant="outline" @click="addKv(mergedHeaders)">+ 添加</t-button>
            </t-tab-panel>

            <t-tab-panel value="query" label="Query Params" style="flex: 1; overflow-y: auto; padding: 12px;">
              <div style="margin-bottom: 8px; font-size: 12px; color: #999;">
                环境公共参数 + API 自身参数（API 优先级高），临时编辑不影响原配置
              </div>
              <t-textarea v-model="mergedParams" :rows="8" placeholder='{"key": "value"}'
                  style="font-family: monospace; font-size: 12px; width: 100%;" />
            </t-tab-panel>

            <t-tab-panel value="body" label="Body" style="flex: 1; overflow-y: auto; padding: 12px;">
              <div style="margin-bottom: 8px; font-size: 12px; color: #999;">
                环境公共 body + API 自身 body（API 优先级高），临时编辑不影响原配置
              </div>
              <t-textarea v-model="mergedBody" :rows="8" placeholder='{"key": "value"}'
                  style="font-family: monospace; font-size: 12px; width: 100%;" />
            </t-tab-panel>

            <t-tab-panel value="env" label="当前环境配置" style="flex: 1; overflow-y: auto; padding: 12px;">
              <div v-if="activeEnv" style="font-size: 13px; line-height: 2;">
                <div><strong>名称：</strong>{{ activeEnv.name }}</div>
                <div><strong>Base URL：</strong>{{ activeEnv.baseURL }}</div>
                <div><strong>Timeout：</strong>{{ activeEnv.timeout }}ms</div>
                <div><strong>Response Type：</strong>{{ activeEnv.responseType }}</div>
                <div><strong>公共 Headers：</strong></div>
                <pre v-if="activeEnv.headers.length > 0" style="background:#f5f5f5;padding:8px;border-radius:4px;font-size:11px;margin:0 0 8px 0;">{{ JSON.stringify(activeEnv.headers, null, 2) }}</pre>
                <span v-else style="color:#999;">（无）</span>
                <div><strong>公共 Params：</strong></div>
                <pre v-if="activeEnv.params && activeEnv.params !== '{\n  \n}'" style="background:#f5f5f5;padding:8px;border-radius:4px;font-size:11px;margin:0 0 8px 0;">{{ activeEnv.params }}</pre>
                <span v-else style="color:#999;">（无）</span>
                <div><strong>公共 Body：</strong></div>
                <pre v-if="activeEnv.body && activeEnv.body !== '{\n  \n}'" style="background:#f5f5f5;padding:8px;border-radius:4px;font-size:11px;margin:0;">{{ activeEnv.body }}</pre>
                <span v-else style="color:#999;">（无）</span>
              </div>
            </t-tab-panel>
          </t-tabs>

          <!-- 响应 -->
          <div v-if="response" style="border-top: 1px solid #e8e8e8; max-height: 300px; overflow: auto;">
            <div style="padding: 8px 16px; display: flex; gap: 12px; align-items: center; background: #fafafa; border-bottom: 1px solid #f0f0f0;">
              <t-tag :theme="response.status < 400 ? 'success' : 'danger'">{{ response.status }} {{ response.statusText }}</t-tag>
              <t-tag theme="default">{{ response.duration }}ms</t-tag>
              <t-tag theme="default">{{ response.size }}</t-tag>
            </div>
            <pre style="padding: 12px 16px; font-size: 12px; margin: 0; white-space: pre-wrap; word-break: break-all;">{{ response.raw }}</pre>
          </div>
        </template>
        <template v-else>
          <div style="flex: 1; display: flex; align-items: center; justify-content: center; color: #ccc; font-size: 14px;">
            请选择 API
          </div>
        </template>
      </div>
    </div>

    <!-- ===== 环境配置弹窗 ===== -->
    <t-dialog
      v-model:visible="envDialogVisible"
      :header="isEditingEnv ? '编辑环境' : '添加环境'"
      width="640px"
      @confirm="handleSaveEnv"
    >
      <t-form :data="editingEnv" label-align="top">
        <t-form-item label="环境名称" :rules="[{ required: true, message: '请输入环境名称' }]">
          <t-input v-model="editingEnv.name" placeholder="开发环境" />
        </t-form-item>
        <t-row :gutter="12">
          <t-col :span="12">
            <t-form-item label="Base URL" :rules="[{ required: true, message: '请输入 Base URL' }]">
              <t-input v-model="editingEnv.baseURL" placeholder="http://localhost:3000" />
            </t-form-item>
          </t-col>
          <t-col :span="6">
            <t-form-item label="Timeout (ms)">
              <t-input-number v-model="editingEnv.timeout" :min="1000" :max="60000" :step="1000" style="width:100%;" />
            </t-form-item>
          </t-col>
          <t-col :span="6">
            <t-form-item label="Response Type">
              <t-select v-model="editingEnv.responseType" :options="[
                { label: 'json', value: 'json' },
                { label: 'text', value: 'text' },
                { label: 'blob', value: 'blob' },
                { label: 'arraybuffer', value: 'arraybuffer' },
              ]" />
            </t-form-item>
          </t-col>
        </t-row>
        <t-form-item label="公共 Headers">
          <div style="width:100%;">
            <div v-for="(h, i) in editingEnv.headers" :key="i" style="display:flex;gap:6px;margin-bottom:6px;">
              <t-input v-model="h.key" placeholder="key" style="width: 200px;" />
              <t-input v-model="h.value" placeholder="value" style="width: 300px;" />
              <t-button size="small" variant="outline" @click="editingEnv.headers.splice(i, 1)">✕</t-button>
            </div>
            <t-button size="small" variant="outline" @click="editingEnv.headers.push({ key: '', value: '' })">+ 添加</t-button>
          </div>
        </t-form-item>
        <t-form-item label="公共 Query Params（JSON 对象）">
          <t-textarea v-model="editingEnv.params" :rows="5" placeholder='{"key": "value"}' style="font-family: monospace; font-size: 12px; width: 100%;" />
        </t-form-item>
        <t-form-item label="公共 Body（JSON 对象，API 级 body 会覆盖此值）">
          <t-textarea v-model="editingEnv.body" :rows="5" placeholder='{"key": "value"}' style="font-family: monospace; font-size: 12px; width: 100%;" />
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- ===== API 编辑弹窗 ===== -->
    <t-dialog
      v-model:visible="apiDialogVisible"
      :header="isEditingApi ? '编辑 API' : '添加 API'"
      width="560px"
      @confirm="handleSaveApi"
    >
      <t-form :data="editingApi" label-align="top">
        <t-form-item label="API 名称" :rules="[{ required: true, message: '请输入名称' }]">
          <t-input v-model="editingApi.name" placeholder="获取用户列表" />
        </t-form-item>
        <t-row :gutter="12">
          <t-col :span="6">
            <t-form-item label="请求方法">
              <t-select v-model="editingApi.method" :options="methodOptions" />
            </t-form-item>
          </t-col>
          <t-col :span="18">
            <t-form-item label="请求路径" :rules="[{ required: true, message: '请输入路径' }]">
              <t-input v-model="editingApi.path" placeholder="/api/v1/users" />
            </t-form-item>
          </t-col>
        </t-row>
        <t-form-item label="描述">
          <t-input v-model="editingApi.description" placeholder="可选" />
        </t-form-item>
        <t-form-item label="Content-Type">
          <t-select v-model="editingApi.contentType" :options="[
            { label: 'application/json', value: 'application/json' },
            { label: 'application/x-www-form-urlencoded', value: 'application/x-www-form-urlencoded' },
            { label: 'text/plain', value: 'text/plain' },
          ]" />
        </t-form-item>
        <t-form-item label="自定义 Headers">
          <div style="width:100%;">
            <div v-for="(h, i) in editingApi.headers" :key="i" style="display:flex;gap:6px;margin-bottom:6px;">
              <t-input v-model="h.key" placeholder="key" style="width: 180px;" />
              <t-input v-model="h.value" placeholder="value" style="width: 240px;" />
              <t-button size="small" variant="outline" @click="editingApi.headers.splice(i, 1)">✕</t-button>
            </div>
            <t-button size="small" variant="outline" @click="editingApi.headers.push({ key: '', value: '' })">+ 添加</t-button>
          </div>
        </t-form-item>
        <t-form-item label="自定义 Query Params（JSON 对象）">
          <t-textarea v-model="editingApi.params" :rows="5" placeholder='{"key": "value"}' style="font-family: monospace; font-size: 12px; width: 100%;" />
        </t-form-item>
        <t-form-item label="自定义 Body（JSON 对象）">
          <t-textarea v-model="editingApi.body" :rows="5" placeholder='{"key": "value"}' style="font-family: monospace; font-size: 12px; width: 100%;" />
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>
