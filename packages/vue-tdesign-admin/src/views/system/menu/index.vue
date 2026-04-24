<template>
  <div class="menu-page">
    <t-card title="菜单管理">
      <template #actions>
        <t-button theme="primary" v-permission="'system:menu:add'" @click="handleAdd">
        <template #icon><t-icon name="add" /></template>
        新增菜单
        </t-button>
      </template>
      <t-table
        :data="tableData"
        :columns="columns"
        row-key="id"
        :tree="{ childrenKey: 'children', expandAll: true }"
      />
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Message } from 'tdesign-vue-next'
import { mockMenus } from '@/mocks/permission'

const tableData = ref(mockMenus)

const columns = [
  {
    colKey: 'name',
    title: '菜单名称',
  },
  {
    colKey: 'code',
    title: '菜单编码',
  },
  {
    colKey: 'icon',
    title: '图标',
    cell: (h: any, { row }: any) => {
      return row.icon ? h('t-icon', { name: row.icon }) : '-'
    }
  },
  {
    colKey: 'path',
    title: '路径',
  },
  {
    colKey: 'type',
    title: '类型',
    cell: (h: any, { row }: any) => {
      const map = { directory: '目录', menu: '菜单', button: '按钮' }
      return h('t-tag', {
        theme: row.type === 'directory' ? 'primary' : row.type === 'menu' ? 'success' : 'info'
      }, map[row.type])
    }
  },
  {
    colKey: 'sort',
    title: '排序',
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

const handleAdd = () => {
  Message.info('新增菜单')
}

const handleEdit = (row: any) => {
  Message.info(`编辑菜单: ${row.name}`)
}

const handleDelete = (row: any) => {
  Message.info(`删除菜单: ${row.name}`)
}
</script>
