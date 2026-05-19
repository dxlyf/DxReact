import { usePermissionStore } from '@/store/permission'

export function usePermission() {
  const permissionStore = usePermissionStore()

  return {
    menus: computed(() => permissionStore.menus),
    permissions: computed(() => permissionStore.permissions),
    hasPermission: permissionStore.hasPermission,
    hasAnyPermission: permissionStore.hasAnyPermission,
    hasAllPermissions: permissionStore.hasAllPermissions,
    fetchMenus: permissionStore.fetchMenus.bind(permissionStore),
    reset: permissionStore.reset.bind(permissionStore),
  }
}
