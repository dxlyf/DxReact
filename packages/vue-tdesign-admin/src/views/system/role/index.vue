<template>
  <div class="role-page">
    <t-card title="角色管理">
      <template #actions>
        <t-button theme="primary" v-permission="'system:role:add'" @click="handleAdd">
        <template #icon><t-icon name="add" /></template>
        新增角色
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
import { mockRoles } from '@/mocks/permission'

const tableData = ref(mockRoles)

const columns = [
  {
    colKey: 'name',
    title: '角色名称',
  },
  {
    colKey: 'code',
    title: '角色编码',
  },
  {
    colKey: 'description',
    title: '角色描述',
  },
  {
    colKey: 'dataScope',
    title: '数据权限',
    cell: (h: any, { row }: any) => {
      const map = { 1: '全部数据', 2: '本部门及以下', 3: '本部门', 4: '仅本人', 5: '自定义' }
      return map[row.dataScope] || '-'
    }
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
        h('t-link', { theme: 'primary', style: 'margin-left: 8px', onClick: () => handlePermission(row) }, '权限配置'),
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
  Message.info('新增角色')
}

const handleEdit = (row: any) => {
  Message.info(`编辑角色: ${row.name}`)
}

const handlePermission = (row: any) => {
  Message.info(`配置权限: ${row.name}`)
}

const handleDelete = (row: any) => {
  Message.info(`删除角色: ${row.name}`)
}

const handlePageChange = (current: number) => {
  pagination.value.current = current
}
</script>
