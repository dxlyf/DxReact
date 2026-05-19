<script setup lang="ts">
import { ref } from 'vue'

const columns = [
  { colKey: 'name', title: '租户名称' },
  { colKey: 'code', title: '租户编码' },
  { colKey: 'status', title: '状态' },
  { colKey: 'expireAt', title: '过期时间' },
  { colKey: 'operation', title: '操作' },
]

const data = ref([
  { id: '1', name: '租户A', code: 'tenant-a', status: 'active', expireAt: '2026-12-31' },
  { id: '2', name: '租户B', code: 'tenant-b', status: 'active', expireAt: '2026-12-31' },
])

function handleEdit(row: any) {
  console.log('编辑', row)
}

function handleDelete(row: any) {
  console.log('删除', row)
}
</script>

<template>
  <div class="tenant-list-page">
    <t-card title="租户管理">
      <template #actions>
        <t-button theme="primary">
          <t-icon name="add" />
          新增租户
        </t-button>
      </template>

      <t-table :data="data" :columns="columns" row-key="id">
        <template #status="{ row }">
          <t-tag :theme="row.status === 'active' ? 'success' : 'warning'">
            {{ row.status === 'active' ? '正常' : '已过期' }}
          </t-tag>
        </template>
        <template #operation="{ row }">
          <t-space>
            <t-button variant="text" theme="primary" @click="handleEdit(row)">编辑</t-button>
            <t-button variant="text" theme="danger" @click="handleDelete(row)">删除</t-button>
          </t-space>
        </template>
      </t-table>
    </t-card>
  </div>
</template>
