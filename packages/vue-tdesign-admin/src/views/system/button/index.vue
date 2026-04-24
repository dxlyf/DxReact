<template>
  <div class="page">
    <t-card title="按钮权限">
      <template #actions>
        <t-button theme="primary" @click="handleAdd">
        <template #icon><t-icon name="add" /></template>
        新增按钮
        </t-button>
      </template>
      <t-alert type="info" message="按钮权限管理，用于控制页面上的按钮显示权限" style="margin-bottom: 16px;" />
      <t-empty description="开发中..." />
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { Message } from 'tdesign-vue-next'

const handleAdd = () => {
  Message.info('新增按钮')
}
</script>
