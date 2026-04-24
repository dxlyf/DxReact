<template>
  <div class="page">
    <t-card title="部门管理">
      <template #actions>
        <t-button theme="primary" @click="handleAdd">
        <template #icon><t-icon name="add" /></template>
        新增部门
        </t-button>
      </template>
      <t-alert type="info" message="部门管理，用于管理组织架构" style="margin-bottom: 16px;" />
      <t-empty description="开发中..." />
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { Message } from 'tdesign-vue-next'

const handleAdd = () => {
  Message.info('新增部门')
}
</script>
