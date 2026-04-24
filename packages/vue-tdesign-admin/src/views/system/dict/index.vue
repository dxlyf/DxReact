<template>
  <div class="page">
    <t-card title="字典管理">
      <template #actions>
        <t-button theme="primary" @click="handleAdd">
        <template #icon><t-icon name="add" /></template>
        新增字典
        </t-button>
      </template>
      <t-alert type="info" message="字典管理，用于管理系统中的字典数据" style="margin-bottom: 16px;" />
      <t-empty description="开发中..." />
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { Message } from 'tdesign-vue-next'

const handleAdd = () => {
  Message.info('新增字典')
}
</script>
