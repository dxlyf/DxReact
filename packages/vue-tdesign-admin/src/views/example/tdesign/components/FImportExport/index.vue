<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef } from 'vue'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'

export type ImportResult = {
  success: boolean
  message: string
  polling: boolean
  data: any
}

export type PollingResult = {
  status: 'running' | 'error' | 'fail' | 'finish'
  data: any
  message: string | null
}

export type ImportMethod = (file: File) => Promise<ImportResult>
export type ExportMethod = () => Promise<any>
export type DownloadMethod = () => Promise<any>
export type PollingMethod = (data: any) => Promise<PollingResult>

type Props = {
  /** 文件选择 accept，默认 .xls,.xlsx */
  accept?: string
  /** 文件选择按钮文案 */
  selectText?: string
  /** 导入按钮文案 */
  importText?: string
  /** 导出按钮文案 */
  exportText?: string
  /** 下载模板按钮文案 */
  downloadText?: string
  /** 导入方法：上传文件，返回导入结果；polling=true 时 data 为任务ID，配合轮询方法使用 */
  importMethod: ImportMethod
  /** 导出方法 */
  exportMethod?: ExportMethod
  /** 下载模板方法 */
  downloadMethod?: DownloadMethod
  /** 轮询方法（可选）：status 不等于 running 时停止轮询，并弹出导入结果提示 */
  pollingMethod?: PollingMethod
  /** 轮询间隔（毫秒） */
  pollingInterval?: number
  /** 轮询方式：interval 使用 setInterval，while 使用 while + sleep */
  pollingMode?: 'interval' | 'while'
  /** 轮询最大次数（超出仍未返回结果则停止轮询并提示超时），默认 10 */
  pollingMaxRetries?: number
}

const props = withDefaults(defineProps<Props>(), {
  accept: '.xls,.xlsx',
  selectText: '选择文件',
  importText: '导入',
  exportText: '导出',
  downloadText: '下载模板',
  pollingInterval: 2000,
  pollingMode: 'interval',
  pollingMaxRetries: 1000,
})

const fileInput = shallowRef<HTMLInputElement | null>(null)
const selectedFile = shallowRef<File | null>(null)
const importing = ref(false)
const exporting = ref(false)
const downloading = ref(false)
const polling = ref(false)

let pollTimer: ReturnType<typeof setInterval> | null = null
let pollingCount = 0
let pollingStopped = false

const triggerChoose = () => {
  fileInput.value?.click()
}

const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  selectedFile.value = input.files?.[0] || null
  // 清空 value，允许重复选择同一文件
  input.value = ''
}

const showImportResultDialog = (success: boolean, message: string) => {
  DialogPlugin.alert({
    header: success ? '导入成功' : '导入失败',
    body: message,
    theme: success ? 'success' : 'danger',
    confirmBtn: { content: '确定' },
  })
}

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  pollingStopped = true
  polling.value = false
  importing.value = false
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * 执行一次轮询，返回是否应停止轮询
 */
const doPollOnce = async (data: any): Promise<boolean> => {
  pollingCount++
  // 轮询超限仍未返回结果，停止轮询并提示
  if (pollingCount > props.pollingMaxRetries) {
    stopPolling()
    showImportResultDialog(false, '导入超时，未在预期时间内获取到结果，请稍后重试')
    return true
  }
  try {
    const res = await props.pollingMethod!(data)
    if (res.status !== 'running') {
      stopPolling()
      const success = res.status === 'finish'
      showImportResultDialog(success, res.message || (success ? '导入成功' : '导入失败'))
      return true
    }
  } catch (err: any) {
    stopPolling()
    showImportResultDialog(false, err?.message || '导入异常')
    return true
  }
  return false
}

/** setInterval 轮询：tick 立即执行一次，之后按间隔轮询 */
const pollByInterval = (data: any) => {
  const tick = async () => {
    await doPollOnce(data)
  }
  tick()
  pollTimer = setInterval(tick, props.pollingInterval)
}

/** while + sleep 轮询：循环轮询直至停止 */
const pollByWhile = async (data: any) => {
  while (!pollingStopped && polling.value) {
    const shouldStop = await doPollOnce(data)
    if (shouldStop) break
    await sleep(props.pollingInterval)
  }
}

const startPolling = (data: any) => {
  stopPolling()
  pollingCount = 0
  pollingStopped = false
  polling.value = true
  importing.value = true
  if (props.pollingMode === 'while') {
    pollByWhile(data)
  } else {
    pollByInterval(data)
  }
}

const handleImport = async () => {
  if (!selectedFile.value) {
    MessagePlugin.warning('请先选择文件')
    return
  }
  if (importing.value) return
  importing.value = true
  try {
    const res = await props.importMethod(selectedFile.value)
    if (!res.success) {
      showImportResultDialog(false, res.message || '导入失败')
      return
    }
    if (res.polling && props.pollingMethod) {
      startPolling(res.data)
    } else {
      showImportResultDialog(true, res.message || '导入成功')
    }
  } catch (err: any) {
    showImportResultDialog(false, err?.message || '导入失败')
  } finally {
    // 开启轮询时 importing 由轮询流程接管，轮询结束后统一复位
    if (!polling.value) {
      importing.value = false
    }
  }
}

const handleExport = async () => {
  if (!props.exportMethod || exporting.value) return
  exporting.value = true
  try {
    await props.exportMethod()
    MessagePlugin.success('导出成功')
  } catch (err: any) {
    MessagePlugin.error(err?.message || '导出失败')
  } finally {
    exporting.value = false
  }
}

const handleDownload = async () => {
  if (!props.downloadMethod || downloading.value) return
  downloading.value = true
  try {
    await props.downloadMethod()
    MessagePlugin.success('下载成功')
  } catch (err: any) {
    MessagePlugin.error(err?.message || '下载失败')
  } finally {
    downloading.value = false
  }
}

onBeforeUnmount(stopPolling)
</script>

<template>
  <div class="import-export">
    <input
      ref="fileInput"
      type="file"
      class="import-export__file-input"
      :accept="accept"
      @change="onFileChange"
    />
    <t-space>
      <t-button variant="outline" @click="triggerChoose">
        <template #icon><t-icon name="upload" /></template>
        {{ selectText }}
      </t-button>
      <span v-if="selectedFile" class="import-export__file-name" :title="selectedFile.name">
        {{ selectedFile.name }}
      </span>
      <t-button
        theme="primary"
        :loading="importing"
        :disabled="importing"
        @click="handleImport"
      >
        {{ importText }}
      </t-button>
      <t-button
        v-if="exportMethod"
        theme="primary"
        variant="outline"
        :loading="exporting"
        @click="handleExport"
      >
        {{ exportText }}
      </t-button>
      <t-button
        v-if="downloadMethod"
        variant="text"
        :loading="downloading"
        @click="handleDownload"
      >
        {{ downloadText }}
      </t-button>
    </t-space>
  </div>
</template>

<style scoped>
.import-export {
  display: inline-flex;
  align-items: center;
}
.import-export__file-input {
  display: none;
}
.import-export__file-name {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--td-text-color-secondary, #5a5e66);
  font-size: 14px;
}
</style>
