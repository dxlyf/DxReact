<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { useTenantStore } from '@/store/tenant'
import { usePermissionStore } from '@/store/permission'

const router = useRouter()
const authStore = useAuthStore()
const tenantStore = useTenantStore()
const permissionStore = usePermissionStore()

const tenantList = computed(() => authStore.user?.tenants ?? [])

async function selectTenant(tenant: any) {
  tenantStore.setCurrentTenant(tenant)
  await tenantStore.fetchTenantConfig(tenant.id)
  await permissionStore.fetchMenus(tenant.id)
  router.push('/dashboard')
}
</script>

<template>
  <div class="select-tenant-container">
    <div class="select-tenant-content">
      <h2>选择租户</h2>
      <p class="subtitle">您属于多个租户，请选择要进入的租户</p>

      <div class="tenant-list">
        <t-card
          v-for="tenant in tenantList"
          :key="tenant.id"
          class="tenant-card"
          hover-shadow
          @click="selectTenant(tenant)"
        >
          <div class="tenant-info">
            <t-avatar :image="tenant.logo" size="large" />
            <div class="tenant-detail">
              <h3>{{ tenant.name }}</h3>
              <t-tag
                :theme="tenant.status === 'active' ? 'success' : 'warning'"
                variant="light"
              >
                {{ tenant.status === 'active' ? '正常' : '已过期' }}
              </t-tag>
            </div>
          </div>
        </t-card>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.select-tenant-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--td-bg-color-page);
}
.select-tenant-content {
  width: 600px;
  text-align: center;
}
h2 {
  margin: 0 0 8px;
  font-size: 28px;
}
.subtitle {
  color: var(--td-text-color-secondary);
  margin-bottom: 32px;
}
.tenant-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.tenant-card {
  cursor: pointer;
  transition: transform 0.2s;
  &:hover {
    transform: translateY(-2px);
  }
}
.tenant-info {
  display: flex;
  align-items: center;
  gap: 16px;
  text-align: left;
}
.tenant-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
  h3 {
    margin: 0;
    font-size: 16px;
  }
}
</style>
