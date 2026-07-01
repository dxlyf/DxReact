<script setup lang="ts">
import { computed, reactive, ref, shallowRef, watch } from 'vue';
import { MessagePlugin, type UploadFile } from 'tdesign-vue-next';
import { useDialog } from '@/hooks/useDialog';
import { usePolling } from '@/hooks/usePolling';

const props = withDefaults(defineProps<{
  slugPrefix?: string
  mode?: 'create' | 'edit'
}>(), {
  slugPrefix: 'import',
  mode: 'create'
})

const emit = defineEmits<{
  (e: 'success'): void
}>()

// 分类信息表单
const categoryFormRef = ref()
const categoryFormData = reactive({ slug: '' })
const categoryName = ref('')

const slugRules = [{ required: true, message: '请填写分类Slug', whitespace: true }]

// Mock fetch category by id
const mockFetchCategory = async (id: string) => {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const map: Record<string, { slug: string; name: string }> = {
    '1': { slug: 'electronics-phone', name: '电子产品-手机' },
    '2': { slug: 'home-furniture', name: '家居产品-家具' },
  }
  return map[id] || { slug: `category-${id}`, name: `分类-${id}` }
}

// 导入文件相关
const importFile = shallowRef<UploadFile[]>([])
const importLoading = ref(false)

const confirmLoading = computed(() => importLoading.value || pollingState.value === 'polling')

const mockImportApi = async (): Promise<{ code: number; data: { jobId: number } }> => {
  await new Promise((resolve) => setTimeout(resolve, 2000))
  return { code: 0, data: { jobId: Date.now() } }
}

const mockPollJobApi = async (jobId: number) => {
  await new Promise((resolve) => setTimeout(resolve, 500))
  // Simulate different statuses by count
  const statuses: Array<'running' | 'finished' | 'failed' | 'unknown' | 'error'> = [
    'running', 'running', 'finished'
  ]
  const idx = Math.min(pollingCount.value, statuses.length - 1)
  const status = statuses[idx]
  const messages: Record<string, string> = {
    running: '导入中...',
    finished: '导入完成',
    failed: '导入失败',
    unknown: '未知状态',
    error: '导入异常',
  }
  return {
    jobId,
    status,
    message: messages[status],
    slug: `${props.slugPrefix}-${jobId}`
  }
}

const {
  pollingState,
  pollingCount,
  lastResult,
  start: startPolling,
  stop: stopPolling,
  resetPollingState
} = usePolling(async (jobId: number) => {
  try {
    return await mockPollJobApi(jobId)
  } catch {
    return {
      jobId,
      status: 'error' as const,
      message: '导入异常',
      slug: `${props.slugPrefix}-${jobId}`
    }
  }
}, {
  interval: 2000,
  maxRetries: 10,
  onError: (err) => {
    MessagePlugin.error(err.message)
  }
})

const [dialogProps, dialogInst] = useDialog(() => ({
  header: '导入数据',
  autoHeight: true,
  width: 520,
  confirmBtn: { loading: confirmLoading.value, theme: 'primary' as const, content: '确定导入' },
  onConfirm: handleImportConfirm,
  onClose: () => {
    importFile.value = []
    stopPolling()
    resetPollingState()
  }
}))

async function handleImportConfirm() {
  // Create 模式下校验 slug
  if (props.mode === 'create') {
    const result = await categoryFormRef.value?.validate()
    if (result !== true) {
      return
    }
  }

  if (!importFile.value.length) {
    MessagePlugin.warning('请选择要上传的文件')
    return
  }
  try {
    importLoading.value = true
    const res = await mockImportApi()
    if (res.code === 0) {
      startPolling(res.data.jobId)
    }
  } catch {
    MessagePlugin.error('导入请求失败')
  } finally {
    importLoading.value = false
  }
}

const terminalStatuses = new Set(['finished', 'failed', 'error'])

watch(pollingState, (state) => {
  if (state === 'stopped') {
    if (lastResult.value?.status === 'finished') {
      MessagePlugin.success('导入成功')
      emit('success')
      dialogInst.close()
    }
  }
})

// Stop polling automatically when a terminal status is reached
watch(() => lastResult.value?.status, (status) => {
  if (status && terminalStatuses.has(status)) {
    stopPolling()
  }
})

const open = async (id?: string) => {
  importFile.value = []
  categoryFormData.slug = ''
  categoryName.value = ''

  if (props.mode === 'edit' && id) {
    const data = await mockFetchCategory(id)
    categoryFormData.slug = data.slug
    categoryName.value = data.name
  }

  dialogInst.open()
}

defineExpose({ open })
</script>

<template>
  <t-dialog v-bind="dialogProps">
    <t-form ref="categoryFormRef" :data="categoryFormData" label-align="top" label-width="80">
      <!-- 分类 Slug（create 模式显示规则，edit 模式禁用） -->
      <t-form-item
        v-if="mode === 'create'"
        label="分类Slug"
        name="slug"
        :rules="slugRules"
      >
        <t-input v-model="categoryFormData.slug" placeholder="请输入分类Slug" />
      </t-form-item>

      <!-- 分类名称（仅 edit 模式显示，禁用） -->
      <t-form-item v-if="mode === 'edit'" label="分类Slug">
        <t-input :model-value="categoryFormData.slug" disabled />
      </t-form-item>
      <t-form-item v-if="mode === 'edit'" label="分类名称">
        <t-input :model-value="categoryName" disabled />
      </t-form-item>

      <!-- 上传文件 -->
      <t-form-item label="上传文件">
        <t-upload v-model="importFile" theme="file" action="/api/import" :size-limit="{ size: 10, unit: 'MB' }" accept=".xlsx,.xls,.csv" :auto-upload="false" :disabled="pollingState === 'polling'" />
      </t-form-item>

      <div v-if="pollingState === 'polling' || lastResult" class="mt-4">
        <table class="job-table">
          <thead>
            <tr>
              <th>Slug</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="lastResult">
              <td>{{ lastResult.slug }}</td>
              <td>
                <template v-if="lastResult.status === 'running'">
                  <t-loading size="small" :text="lastResult.message || '导入中...'" />
                </template>
                <template v-else-if="lastResult.status === 'finished'">
                  <t-tag theme="success" variant="light">{{ lastResult.message }}</t-tag>
                </template>
                <template v-else-if="lastResult.status === 'error' || lastResult.status === 'failed'">
                  <span class="text-red-500">{{ lastResult.message || '导入失败' }}</span>
                </template>
                <template v-else>
                  <span class="text-orange-500">{{ lastResult.message || '未知状态' }}</span>
                </template>
              </td>
            </tr>
            <tr v-else>
              <td colspan="2" class="text-center">
                <t-loading size="small" text="正在提交导入请求..." />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div></div>
    </t-form>
  </t-dialog>
</template>

<style scoped>
.job-table {
  width: 100%;
  border-collapse: collapse;
}
.job-table :deep(:where(td, th)) {
  border: solid 1px rgba(0, 0, 0, 0.2);
  text-align: center;
}
.job-table :deep(thead th) {
  font-weight: 700;
  padding: 4px 0;
  background-color: rgba(0, 0, 0, 0.1);
}
.job-table :deep(tbody td) {
  padding: 8px 0;
}
</style>
