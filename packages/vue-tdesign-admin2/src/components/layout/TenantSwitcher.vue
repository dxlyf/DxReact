<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { useTenantStore } from '@/store/tenant'
import { usePermissionStore } from '@/store/permission'
import { clearAllTenantData } from '@/utils/storage'

const router = useRouter()
const authStore = useAuthStore()
const tenantStore = useTenantStore()
const permissionStore = usePermissionStore()

const visible = ref(false)

const tenantList = computed(() => authStore.user?.tenants ?? [])

async function switchTenant(tenant: any) {
  visible.value = false

  clearAllTenantData(tenantStore.currentTenantId || '')
  permissionStore.reset()

  tenantStore.setCurrentTenant(tenant)
  await tenantStore.fetchTenantConfig(tenant.id)

  await permissionStore.fetchMenus(tenant.id)

  router.push('/dashboard')
}
</script>

<template>
  <t-dropdown v-model:popup-visible="visible" trigger="click">
    <t-button variant="text" class="tenant-switcher">
      <t-icon name="shop" />
      <span class="tenant-name">{{ tenantStore.tenantName || '选择租户' }}</span>
      <t-icon name="chevron-down" />
    </t-button>
    <template #dropdown>
      <t-dropdown-menu>
        <t-dropdown-item
          v-for="t in tenantList"
          :key="t.id"
          :class="{ active: t.id === tenantStore.currentTenantId }"
          @click="switchTenant(t)"
        >
          <t-icon name="user" />
          {{ t.name }}
        </t-dropdown-item>
      </t-dropdown-menu>
    </template>
  </t-dropdown>
</template>

<style scoped lang="scss">
.tenant-switcher {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tenant-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.active {
  color: var(--td-brand-color);
  font-weight: 600;
}
</style>
