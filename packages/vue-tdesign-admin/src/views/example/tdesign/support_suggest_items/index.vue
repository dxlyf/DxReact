<script setup lang="ts">
import MainLayout from '@/views/example/tdesign/components/Layouts/MainLayout.vue';
import Table from '@/views/example/tdesign/components/FTable/index.vue'
import { DialogPlugin, type TableProps } from 'tdesign-vue-next';
import { useTable } from '@/views/example/tdesign/hooks/useTable';
import { useRouter } from 'vue-router'

const router = useRouter()

const breadcrumbOptions = [
  {
    content: '首页',
    to: '/',
  },
  {
    content: '推荐内容列',
  },
]

const data = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  title: '推荐内容标题' + (i + 1),
  onlineTime: '2026-01-' + String((i % 28) + 1).padStart(2, '0') + ' 00:00:00',
  offlineTime: '2026-07-' + String((i % 28) + 1).padStart(2, '0') + ' 23:59:59',
  status: i % 3 === 0 ? '已发布' : i % 3 === 1 ? '草稿' : '待审核',
  isFirstRecommend: i % 4 === 0,
}))

const [tableProps, tableInst] = useTable({
  request: async (params) => {
    const newParams = { ...params }
    let newData = data.filter((item) => {
      if (newParams.title && !item.title.includes(newParams.title)) {
        return false
      }
      if (newParams.status && item.status !== newParams.status) {
        return false
      }
      return true
    })
    return {
      success: true,
      records: newData.slice(
        (params.current - 1) * params.pageSize,
        params.current * params.pageSize,
      ),
      total: newData.length,
    }
  },
})

const columns: TableProps['columns'] = [
  {
    title: '标题',
    colKey: 'title',
    ellipsis: true,
    width: 200,
  },
  {
    title: '上线时间',
    colKey: 'onlineTime',
    width: 180,
  },
  {
    title: '下线时间',
    colKey: 'offlineTime',
    width: 180,
  },
  {
    title: '发布状态',
    colKey: 'status',
    width: 100,
  },
  {
    title: '是否首位推荐',
    colKey: 'isFirstRecommend',
    width: 120,
  },
  {
    title: '操作',
    colKey: 'actions',
    width: 160,
  },
]

const handleEditStandard = () => {
  console.log('编辑推荐内容标配')
}

const handleCreate = () => {
  console.log('创建推荐内容')
  router.push({ path: './new' })
}

const handleEdit = (row: any) => {
  console.log('编辑', row)
  router.push({ path: './edit', query: { id: row.id } })
}

const handleDelete = (row: any) => {
  const confirmInst = DialogPlugin.confirm({
    header: false,
    theme: 'danger',
    body: '确定删除该推荐内容吗？',
    confirmBtn: {
      theme: 'danger',
      content: '删除',
    },
    onConfirm: async () => {
      try {
        confirmInst.setConfirmLoading(true)
        // await deleteSupportSuggestItem(row.id)
        confirmInst.setConfirmLoading(false)
        confirmInst.destroy()
        tableInst.refresh()
      } catch (e) {
        confirmInst.setConfirmLoading(false)
      }
    },
  })
}
</script>

<template>
  <MainLayout
    layout="list"
    show-lang
    title="推荐内容列"
    :breadcrumb-options="breadcrumbOptions"
  >
    <template #operation>
      <t-space>
        <t-button theme="default" @click="handleEditStandard">编辑推荐内容标配</t-button>
        <t-button theme="primary" @click="handleCreate">创建推荐内容</t-button>
      </t-space>
    </template>
    <Table v-bind="tableProps" :columns="columns">
      <template #isFirstRecommend="{ row }">
        <t-tag :theme="row.isFirstRecommend ? 'primary' : 'default'" variant="light">
          {{ row.isFirstRecommend ? '是' : '否' }}
        </t-tag>
      </template>
      <template #status="{ row }">
        <t-tag
          :theme="row.status === '已发布' ? 'success' : row.status === '草稿' ? 'default' : 'warning'"
          variant="light"
        >
          {{ row.status }}
        </t-tag>
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

<style scoped></style>
