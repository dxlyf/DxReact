import { defineStore } from 'pinia'
import type { MenuItem } from '@/types/menu'
import { getMenusApi } from '@/api/modules/menu'

interface PermissionState {
  menus: MenuItem[]
  permissions: string[]
}

export const usePermissionStore = defineStore('permission', {
  state: (): PermissionState => ({
    menus: [],
    permissions: [],
  }),

  getters: {
    hasPermission: (state) => (permission: string): boolean => {
      return state.permissions.includes(permission)
    },

    hasAnyPermission: (state) => (permissions: string[]): boolean => {
      return permissions.some(p => state.permissions.includes(p))
    },

    hasAllPermissions: (state) => (permissions: string[]): boolean => {
      return permissions.every(p => state.permissions.includes(p))
    },
  },

  actions: {
    async fetchMenus(tenantId: string): Promise<MenuItem[]> {
      const menus = await getMenusApi(tenantId)
      this.menus = menus
      this.permissions = extractPermissions(menus)
      return menus
    },

    reset(): void {
      this.menus = []
      this.permissions = []
    },
  },
})

function extractPermissions(menus: MenuItem[]): string[] {
  const perms: string[] = []
  function traverse(items: MenuItem[]) {
    for (const item of items) {
      if (item.permission) perms.push(item.permission)
      if (item.children) traverse(item.children)
    }
  }
  traverse(menus)
  return perms
}
