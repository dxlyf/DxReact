import type { TenantTheme } from '@/types/tenant'

export function applyTenantTheme(theme?: TenantTheme) {
  if (!theme) return

  const root = document.documentElement

  if (theme.primaryColor) {
    root.style.setProperty('--td-brand-color', theme.primaryColor)
    root.style.setProperty('--td-brand-color-hover', theme.primaryColorHover || theme.primaryColor)
    root.style.setProperty('--td-brand-color-focus', theme.primaryColorFocus || theme.primaryColor)
    root.style.setProperty('--td-brand-color-active', theme.primaryColorActive || theme.primaryColor)
  }

  const logoEl = document.querySelector('.app-logo') as HTMLImageElement | null
  if (logoEl && theme.logo) {
    logoEl.src = theme.logo
  }

  if (theme.favicon) {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (link) link.href = theme.favicon
  }

  if (theme.title) {
    document.title = theme.title
  }
}

export function useTheme() {
  return {
    applyTenantTheme,
  }
}
