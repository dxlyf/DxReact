<script setup lang="ts">
import { onBeforeUnmount, reactive, ref } from 'vue'
import { type DialogProps, type UploadFile } from 'tdesign-vue-next'
import { useDialog } from '@/hooks/useDialog'

export type ImportResult = {
  data: any
  success: boolean
  message: string | null
  polling: boolean
}

export type PollingResult = {
  status: 'running' | 'error' | 'fail' | 'finish'
  data: any
  message: string | null
}

export type ImportMethod = () => Promise<ImportResult>
export type PollingMethod = (data: any) => Promise<PollingResult>

/** 结果弹窗传给 slot 的数据 */
export type ImportResultInfo = {
  success: boolean
  message: string
  importResult?: ImportResult
  pollingResult?: PollingResult
}

const emit = defineEmits<{
  /** 导入成功（含轮询 finish） */
  success: [result: ImportResultInfo]
  /** 导入失败（含轮询 fail/error/超时） */
  fail: [result: ImportResultInfo]
}>()

type Props = {
  /** 导入方法：确认后调用；polling=true 时 data 为任务ID，配合轮询方法使用 */
  importMethod: ImportMethod
  /** 轮询方法（可选）：status 不等于 running 时停止轮询，并弹出导入结果提示 */
  pollingMethod?: PollingMethod
  /** 轮询间隔（毫秒） */
  pollingInterval?: number
  /** 轮询最大次数（超出仍未返回结果则停止轮询并提示超时） */
  pollingMaxRetries?: number
  /** 文件选择 accept */
  accept?: string
  /** 导入按钮文案 */
  text?: string
  /** 文件上传项 label */
  label?: string
  /** 文件上传 placeholder */
  placeholder?: string
  /** 必填校验提示 */
  requiredMessage?: string
  /** 弹出窗标题 */
  dialogTitle?: string
  /** 结果弹窗配置，可覆盖 header/width 等（onConfirm 默认关闭弹窗） */
  resultDialogProps?: Partial<DialogProps>
}

const props = withDefaults(defineProps<Props>(), {
  pollingInterval: 2000,
  pollingMaxRetries: 1000,
  accept: '.xls,.xlsx',
  text: '导入',
  label: '导入文件',
  placeholder: '请选择要导入的文件',
  requiredMessage: '请选择要导入的文件',
  dialogTitle: '导入',
})

// 导入按钮 loading：导入中或轮询中均为 true
const importing = ref(false)
const importFile = ref<UploadFile[]>([])
const formRef = ref()

// 结果弹窗数据
const resultInfo = reactive<ImportResultInfo>({
  success: false,
  message: '',
})

defineSlots<{
  /** 自定义结果弹窗内容，默认展示 message */
  result?: (props: ImportResultInfo) => any
}>()

const showResultDialog = (success: boolean, message: string, extra: Partial<ImportResultInfo> = {}) => {
  resultInfo.success = success
  resultInfo.message = message
  resultInfo.importResult = extra.importResult
  resultInfo.pollingResult = extra.pollingResult
  // 通知父组件导入结果
  if (success) {
    emit('success', { ...resultInfo })
  } else {
    emit('fail', { ...resultInfo })
  }
  // 先关闭再打开，避免重复打开时 toggle 关闭
  resultDialogInst.close()
  resultDialogInst.open()
}

// ===== 轮询 =====
let pollTimer: ReturnType<typeof setInterval> | null = null
let pollingCount = 0

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

const startPolling = (data: any) => {
  stopPolling()
  pollingCount = 0
  const tick = async () => {
    pollingCount++
    // 轮询超限仍未返回结果，停止轮询并提示
    if (pollingCount > props.pollingMaxRetries) {
      stopPolling()
      importing.value = false
      showResultDialog(false, '导入超时，未在预期时间内获取到结果，请稍后重试')
      return
    }
    try {
      const res = await props.pollingMethod!(data)
      if (res.status !== 'running') {
        stopPolling()
        importing.value = false
        showResultDialog(res.status === 'finish', res.message || '', { pollingResult: res })
      }
    } catch (err: any) {
      stopPolling()
      importing.value = false
      showResultDialog(false, err?.message || '导入异常')
    }
  }
  tick()
  pollTimer = setInterval(tick, props.pollingInterval)
}

// ===== 弹窗 =====
const [dialogProps, dialogInst] = useDialog(() => ({
  header: props.dialogTitle,
  width: 480,
  confirmBtn: { content: '确认', theme: 'primary' as const },
  cancelBtn: { content: '取消' },
  onConfirm: handleConfirm,
}))

// 结果弹窗
const [resultDialogProps, resultDialogInst] = useDialog(() => ({
  header: resultInfo.success ? '导入成功' : '导入失败',
  confirmBtn: { content: '确定', theme: 'primary' as const },
  cancelBtn: null,
  ...(props.resultDialogProps||{}),
  onConfirm: () => resultDialogInst.close(),
}))

const openDialog = () => {
  importFile.value = []
  dialogInst.open()
}

async function handleConfirm() {
  // 先通过表单校验必填
  const result = await formRef.value?.validate()
  if (result !== true) {
    return
  }
  // 确认后立即关闭弹窗，导入按钮进入 loading
  dialogInst.close()
  importing.value = true
  try {
    const res = await props.importMethod()
    if (!res.success) {
      importing.value = false
      showResultDialog(false, res.message || '', { importResult: res })
      return
    }
    if (res.polling && props.pollingMethod) {
      // 开启轮询，loading 由轮询流程结束统一复位
      startPolling(res.data)
    } else {
      importing.value = false
      showResultDialog(true, res.message || '', { importResult: res })
    }
  } catch (err: any) {
    importing.value = false
    showResultDialog(false, err?.message || '导入失败')
  }
}

onBeforeUnmount(stopPolling)
</script>

<template>
  <div class="f-import-button">
    <t-button theme="primary" :loading="importing" :disabled="importing" @click="openDialog">
      {{ text }}
    </t-button>

    <t-dialog v-bind="dialogProps">
      <t-form ref="formRef" :data="{ importFile }" label-align="top" class="f-import-button__dialog-body">
        <t-form-item
          :label="label"
          name="importFile"
          :rules="[{ required: true, message: requiredMessage }]"
        >
          <t-upload
            v-model="importFile"
            theme="file"
            action="/api/import"
            :accept="accept"
            :auto-upload="false"
            :disabled="importing"
            :placeholder="placeholder"
          />
        </t-form-item>
      </t-form>
    </t-dialog>

    <t-dialog v-bind="resultDialogProps">
      <slot name="result" v-bind="resultInfo">
        <div class="f-import-button__result-default">
          <t-icon :name="resultInfo.success ? 'check-circle' : 'error-circle'" :size="32" />
          <p>{{ resultInfo.message }}</p>
        </div>
      </slot>
    </t-dialog>
  </div>
</template>

<style scoped>
.f-import-button__dialog-body {
  padding: 8px 0;
}
.f-import-button__result-default {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  color: var(--td-text-color-primary, #1c1c1c);
}
.f-import-button__result-default p {
  margin: 0;
}
</style>
