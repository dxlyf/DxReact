import { defineStore } from 'pinia'
import type { TenantInfo, TenantConfig, TenantTheme } from '@/types/tenant'
import { getTenantInfoApi, getTenantConfigApi } from '@/api/modules/tenant'

interface TenantState {
  currentTenantId: string | null
  currentTenant: TenantInfo | null
  config: TenantConfig | null
  loading: boolean
}

export const useTenantStore = defineStore('tenant', {
  state: (): TenantState => ({
    currentTenantId: null,
    currentTenant: null,
    config: null,
    loading: false,
  }),

  getters: {
    tenantName: (state): string => state.currentTenant?.name ?? '',
    tenantLogo: (state): string => state.currentTenant?.logo ?? '',
    tenantTheme: (state): TenantTheme | undefined => state.config?.theme,
  },

  actions: {
    setCurrentTenant(tenant: TenantInfo): void {
      this.currentTenantId = tenant.id
      this.currentTenant = tenant
      localStorage.setItem('currentTenantId', tenant.id)
    },

    setCurrentTenantId(id: string): void {
      this.currentTenantId = id
      localStorage.setItem('currentTenantId', id)
    },

    async fetchTenantInfo(tenantId: string): Promise<TenantInfo> {
      this.loading = true
      try {
        const info = await getTenantInfoApi(tenantId)
        this.currentTenant = info
        this.currentTenantId = info.id
        return info
      } finally {
        this.loading = false
      }
    },

    async fetchTenantConfig(tenantId: string): Promise<TenantConfig> {
      const config = await getTenantConfigApi(tenantId)
      this.config = config
      return config
    },

    clearCurrentTenant(): void {
      this.currentTenantId = null
      this.currentTenant = null
      this.config = null
      localStorage.removeItem('currentTenantId')
    },
  },
})
