<template>
  <div class="user-page">
    <t-card title="用户管理">
      <template #actions>
        <t-button theme="primary" v-permission="'system:user:add'" @click="handleAdd">
        <template #icon><t-icon name="add" /></template>
        新增用户
        </t-button>
      </template>
      <t-table
        :data="tableData"
        :columns="columns"
        :pagination="pagination"
        row-key="id"
        @page-change="handlePageChange"
      />
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Message } from 'tdesign-vue-next'
import { mockUsers } from '@/mocks/permission'

const tableData = ref(mockUsers)

const columns = [
  {
    colKey: 'username',
    title: '用户名',
  },
  {
    colKey: 'name',
    title: '姓名',
  },
  {
    colKey: 'email',
    title: '邮箱',
  },
  {
    colKey: 'phone',
    title: '手机号',
  },
  {
    colKey: 'status',
    title: '状态',
    cell: (h: any, { row }: any) => {
      return h('t-tag', {
        theme: row.status === 1 ? 'success' : 'danger'
      }, row.status === 1 ? '启用' : '禁用')
    }
  },
  {
    colKey: 'createdAt',
    title: '创建时间',
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
  total: 3
})

const handleAdd = () => {
  Message.info('新增用户')
}

const handleEdit = (row: any) => {
  Message.info(`编辑用户: ${row.name}`)
}

const handleDelete = (row: any) => {
  Message.info(`删除用户: ${row.name}`)
}

const handlePageChange = (current: number) => {
  pagination.value.current = current
}
</script>
