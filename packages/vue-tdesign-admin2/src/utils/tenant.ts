import type { TenantInfo } from '@/types/tenant'

export function isUserInTenant(user: any, tenantId: string): boolean {
  return user?.tenants?.some((t: TenantInfo) => t.id === tenantId) ?? false
}
