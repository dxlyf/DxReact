import type { Directive, DirectiveBinding, App } from 'vue'
import { usePermissionStore } from '@/stores/permission'

export function hasPermission(permission: string | string[]): boolean {
  const permissionStore = usePermissionStore()
  
  if (permissionStore.isSuperAdmin) {
    return true
  }
  
  const permissions = Array.isArray(permission) ? permission : [permission]
  return permissionStore.hasPermission(permissions)
}

export function hasAnyPermission(permissions: string[]): boolean {
  const permissionStore = usePermissionStore()
  
  if (permissionStore.isSuperAdmin) {
    return true
  }
  
  return permissionStore.hasAnyPermission(permissions)
}

export function hasAllPermissions(permissions: string[]): boolean {
  const permissionStore = usePermissionStore()
  
  if (permissionStore.isSuperAdmin) {
    return true
  }
  
  return permissionStore.hasAllPermissions(permissions)
}

export const vPermission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding
    
    if (value) {
      const hasAuth = hasPermission(value)
      if (!hasAuth) {
        el.parentNode?.removeChild(el)
      }
    }
  },
  
  updated(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding
    
    if (value) {
      const hasAuth = hasPermission(value)
      if (!hasAuth) {
        el.parentNode?.removeChild(el)
      }
    }
  }
}

export function registerDirectives(app: App) {
  app.directive('permission', vPermission)
}
