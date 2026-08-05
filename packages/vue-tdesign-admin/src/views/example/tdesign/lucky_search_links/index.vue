<script setup lang="ts">
import MainLayout from '@/views/example/tdesign/components/Layouts/MainLayout.vue'
import Table from '@/views/example/tdesign/components/FTable/index.vue'
import FImportExport, {
  type ImportMethod,
  type ExportMethod,
  type DownloadMethod,
  type PollingMethod,
} from '@/views/example/tdesign/components/FImportExport/index.vue'
import { useTable } from '@/views/example/tdesign/hooks/useTable'
import { DialogPlugin, type TableProps } from 'tdesign-vue-next'

const breadcrumbOptions = [
  { content: '首页', to: '/' },
  { content: '快速链接' },
]

type QuickLink = {
  id: number
  link: string
  title: string
}

const data = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  link: 'https://example.com/lucky/' + (i + 1),
  title: '快速链接' + (i + 1),
}))

const [tableProps, tableInst] = useTable({
  request: async (params) => {
    const start = (params.current - 1) * params.pageSize
    return {
      success: true,
      records: data.slice(start, start + params.pageSize),
      total: data.length,
    }
  },
})

const columns: TableProps['columns'] = [
  {
    title: '链接',
    colKey: 'link',
    ellipsis: true,
  },
  {
    title: '标题',
    colKey: 'title',
  },
  {
    title: '操作',
    colKey: 'actions',
    width: 160,
  },
]

const handleCreate = () => {
  console.log('handleCreate')
}

const handleEdit = (row: QuickLink) => {
  console.log('handleEdit', row)
}

const handleDelete = (row: QuickLink) => {
  DialogPlugin.confirm({
    header: '确认删除',
    body: '确定删除该快速链接吗？',
    theme: 'danger',
    onConfirm: () => {
      console.log('删除快速链接', row)
      tableInst.refresh()
    },
  })
}

// ===== 导入导出 =====
const importMethod: ImportMethod = async (file) => {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  console.log('导入文件:', file)
  return { success: true, message: '导入请求已提交', polling: true, data: Date.now() }
}

const pollingMethod: PollingMethod = async (taskId) => {
  await new Promise((resolve) => setTimeout(resolve, 500))
  console.log('轮询任务:', taskId)
  const statuses: PollingResultStatus[] = ['running', 'running', 'finish']
  const status = statuses[Math.min((taskId % 3), statuses.length - 1)] as PollingResultStatus
  return {
    status,
    data: null,
    message: status === 'finish' ? '导入完成' : '导入中...',
  }
}

type PollingResultStatus = 'running' | 'error' | 'fail' | 'finish'

const exportMethod: ExportMethod = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  console.log('导出')
}

const downloadMethod: DownloadMethod = async () => {
  await new Promise((resolve) => setTimeout(resolve, 800))
  console.log('下载模板')
}
</script>

<template>
  <MainLayout layout="list" title="快速链接" :breadcrumb-options="breadcrumbOptions">
    <template #operation>
      <t-button theme="primary" @click="handleCreate">新增</t-button>
    </template>
    <FImportExport
      class="mb-4"
      :import-method="importMethod"
      :export-method="exportMethod"
      :download-method="downloadMethod"
      :polling-method="pollingMethod"
    />
    <Table v-bind="tableProps" :columns="columns">
      <template #link="{ row }">
        <t-link theme="primary" :href="row.link" target="_blank">{{ row.link }}</t-link>
      </template>
      <template #actions="{ row }">
        <t-space>
          <t-link theme="primary" @click="handleEdit(row)">编辑</t-link>
          <t-link theme="danger" @click="handleDelete(row)">删除</t-link>
        </t-space>
      </template>
    </Table>
  </MainLayout>
</template>
