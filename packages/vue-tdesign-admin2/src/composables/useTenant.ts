import { useTenantStore } from '@/store/tenant'

export function useTenant() {
  const tenantStore = useTenantStore()

  return {
    currentTenantId: computed(() => tenantStore.currentTenantId),
    currentTenant: computed(() => tenantStore.currentTenant),
    tenantName: computed(() => tenantStore.tenantName),
    tenantLogo: computed(() => tenantStore.tenantLogo),
    tenantTheme: computed(() => tenantStore.tenantTheme),
    setCurrentTenant: tenantStore.setCurrentTenant.bind(tenantStore),
    setCurrentTenantId: tenantStore.setCurrentTenantId.bind(tenantStore),
    fetchTenantInfo: tenantStore.fetchTenantInfo.bind(tenantStore),
    fetchTenantConfig: tenantStore.fetchTenantConfig.bind(tenantStore),
    clearCurrentTenant: tenantStore.clearCurrentTenant.bind(tenantStore),
  }
}
