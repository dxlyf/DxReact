<template>
  <div class="page">
    <t-card title="API权限">
      <template #actions>
        <t-button theme="primary" @click="handleAdd">
        <template #icon><t-icon name="add" /></template>
        新增API
        </t-button>
      </template>
      <t-alert type="info" message="API权限管理，用于控制API接口访问权限" style="margin-bottom: 16px;" />
      <t-table
        :data="tableData"
        :columns="columns"
        :pagination="pagination"
        row-key="id"
      />
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Message } from 'tdesign-vue-next'
import { mockApiPermissions } from '@/mocks/permission'

const tableData = ref(mockApiPermissions)

const columns = [
  {
    colKey: 'name',
    title: 'API名称',
  },
  {
    colKey: 'code',
    title: 'API编码',
  },
  {
    colKey: 'module',
    title: '所属模块',
  },
  {
    colKey: 'path',
    title: '请求路径',
  },
  {
    colKey: 'method',
    title: '请求方式',
    cell: (h: any, { row }: any) => {
      const themeMap = { GET: 'success', POST: 'primary', PUT: 'warning', DELETE: 'danger', PATCH: 'info' }
      return h('t-tag', { theme: themeMap[row.method as keyof typeof themeMap] }, row.method)
    }
  },
  {
    colKey: 'description',
    title: '描述',
  },
  {
    colKey: 'op',
    title: '操作',
    cell: (h: any, { row }: any) => {
      return [
        h('t-link', { theme: 'primary', onClick: () => handleEdit(row) }, '编辑'),
        h('t-link', { theme: 'primary', style: 'margin-left: 8px', onClick: () => handleDelete(row) }, '删除')
      ]
    }
  }
]

const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 9
})

const handleAdd = () => {
  Message.info('新增API')
}

const handleEdit = (row: any) => {
  Message.info(`编辑API: ${row.name}`)
}

const handleDelete = (row: any) => {
  Message.info(`删除API: ${row.name}`)
}
</script>
