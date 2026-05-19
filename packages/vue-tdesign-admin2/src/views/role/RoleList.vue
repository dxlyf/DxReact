<script setup lang="ts">
import { ref } from 'vue'

const columns = [
  { colKey: 'name', title: '角色名称' },
  { colKey: 'code', title: '角色编码' },
  { colKey: 'description', title: '描述' },
  { colKey: 'operation', title: '操作' },
]

const data = ref([
  { id: '1', name: '管理员', code: 'admin', description: '拥有所有权限' },
  { id: '2', name: '普通用户', code: 'user', description: '基础操作权限' },
])

function handleEdit(row: any) {
  console.log('编辑', row)
}

function handleDelete(row: any) {
  console.log('删除', row)
}
</script>

<template>
  <div class="role-list-page">
    <t-card title="角色管理">
      <template #actions>
        <t-button theme="primary">
          <t-icon name="add" />
          新增角色
        </t-button>
      </template>

      <t-table :data="data" :columns="columns" row-key="id">
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
