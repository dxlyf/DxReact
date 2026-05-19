<script setup lang="ts">
import { ref } from 'vue'

const columns = [
  { colKey: 'username', title: '用户名' },
  { colKey: 'nickname', title: '昵称' },
  { colKey: 'email', title: '邮箱' },
  { colKey: 'role', title: '角色' },
  { colKey: 'operation', title: '操作' },
]

const data = ref([
  { id: '1', username: 'admin', nickname: '管理员', email: 'admin@example.com', role: 'tenant_admin' },
  { id: '2', username: 'user1', nickname: '用户1', email: 'user1@example.com', role: 'user' },
])

function handleEdit(row: any) {
  console.log('编辑', row)
}

function handleDelete(row: any) {
  console.log('删除', row)
}
</script>

<template>
  <div class="user-list-page">
    <t-card title="用户管理">
      <template #actions>
        <t-button theme="primary">
          <t-icon name="add" />
          新增用户
        </t-button>
      </template>

      <t-table :data="data" :columns="columns" row-key="id">
        <template #role="{ row }">
          <t-tag :theme="row.role === 'tenant_admin' ? 'primary' : 'default'">
            {{ row.role === 'tenant_admin' ? '管理员' : '普通用户' }}
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
