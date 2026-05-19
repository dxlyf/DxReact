import request from '../request'
import type { TenantInfo, TenantConfig } from '@/types/tenant'

export function getTenantInfoApi(tenantId: string): Promise<TenantInfo> {
  return request.get(`/tenants/${tenantId}`)
}

export function getTenantConfigApi(tenantId: string): Promise<TenantConfig> {
  return request.get(`/tenants/${tenantId}/config`)
}

export function updateTenantConfigApi(tenantId: string, config: TenantConfig): Promise<void> {
  return request.put(`/tenants/${tenantId}/config`, config)
}
