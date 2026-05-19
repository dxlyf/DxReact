<script setup lang="ts">
import { useTenantStore } from '@/store/tenant'

const tenantStore = useTenantStore()
</script>

<template>
  <div class="dashboard-page">
    <t-row :gutter="[16, 16]">
      <t-col :span="6">
        <t-card title="欢迎">
          <p>当前租户：{{ tenantStore.tenantName }}</p>
          <p>租户ID：{{ tenantStore.currentTenantId }}</p>
        </t-card>
      </t-col>
      <t-col :span="6">
        <t-card title="系统状态">
          <t-statistic title="用户数" value="128" trend="up" />
        </t-card>
      </t-col>
    </t-row>

    <t-row :gutter="[16, 16]" class="mt-4">
      <t-col :span="12">
        <t-card title="快捷入口">
          <t-space>
            <t-button theme="primary">用户管理</t-button>
            <t-button theme="default">角色管理</t-button>
            <t-button theme="default">系统设置</t-button>
          </t-space>
        </t-card>
      </t-col>
    </t-row>
  </div>
</template>

<style scoped lang="scss">
.dashboard-page {
  .mt-4 {
    margin-top: 16px;
  }
}
</style>
