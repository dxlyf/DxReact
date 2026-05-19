export interface TenantInfo {
  id: string
  name: string
  code: string
  logo?: string
  status: 'active' | 'inactive' | 'expired'
  packageId: string
  expireAt: string
  userCount: number
  createdAt: string
}

export interface TenantConfig {
  theme?: TenantTheme
  locale?: string
  features?: string[]
}

export interface TenantTheme {
  primaryColor?: string
  primaryColorHover?: string
  primaryColorFocus?: string
  primaryColorActive?: string
  logo?: string
  favicon?: string
  title?: string
}
