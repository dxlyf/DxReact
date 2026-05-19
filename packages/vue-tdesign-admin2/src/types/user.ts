import type { TenantInfo } from "./tenant"

export interface UserInfo {
  id: string
  username: string
  nickname: string
  avatar?: string
  email?: string
  role: 'super_admin' | 'tenant_admin' | 'user'
  tenants: TenantInfo[]
  currentTenantId?: string
  permissions: string[]
}

export interface LoginParams {
  username: string
  password: string
  tenantId: string
}

export interface LoginResult {
  token: string
  refreshToken: string
  expiresIn: number
}