import { defineStore } from 'pinia'
import type { Menu, Role, User, ApiPermission, PermissionState } from '@/types/permission'

export const usePermissionStore = defineStore('permission', {
  state: (): PermissionState => ({
    menus: [],
    roles: [],
    users: [],
    apiPermissions: [],
    currentUserPermissions: [],
    currentUserRole: null
  }),

  getters: {
    menuTree: (state) => {
      const buildTree = (items: Menu[], parentId?: string): Menu[] => {
        return items
          .filter(item => item.parentId === parentId)
          .map(item => ({
            ...item,
            children: buildTree(items, item.id)
          }))
          .sort((a, b) => a.sort - b.sort)
      }
      return buildTree(state.menus)
    },

    hasPermission: (state) => (permission: string | string[]): boolean => {
      const permissions = Array.isArray(permission) ? permission : [permission]
      return permissions.some(p => state.currentUserPermissions.includes(p))
    },

    hasAnyPermission: (state) => (permissions: string[]): boolean => {
      return permissions.some(p => state.currentUserPermissions.includes(p))
    },

    hasAllPermissions: (state) => (permissions: string[]): boolean => {
      return permissions.every(p => state.currentUserPermissions.includes(p))
    },

    isSuperAdmin: (state): boolean => {
      return state.currentUserRole?.code === 'admin'
    }
  },

  actions: {
    setMenus(menus: Menu[]) {
      this.menus = menus
    },

    setRoles(roles: Role[]) {
      this.roles = roles
    },

    setUsers(users: User[]) {
      this.users = users
    },

    setApiPermissions(permissions: ApiPermission[]) {
      this.apiPermissions = permissions
    },

    setCurrentUserPermissions(permissions: string[]) {
      this.currentUserPermissions = permissions
    },

    setCurrentUserRole(role: Role | null) {
      this.currentUserRole = role
    },

    addMenu(menu: Menu) {
      this.menus.push(menu)
    },

    updateMenu(menu: Menu) {
      const index = this.menus.findIndex(m => m.id === menu.id)
      if (index !== -1) {
        this.menus[index] = menu
      }
    },

    deleteMenu(menuId: string) {
      const deleteRecursive = (id: string) => {
        const index = this.menus.findIndex(m => m.id === id)
        if (index !== -1) {
          this.menus.splice(index, 1)
        }
        const children = this.menus.filter(m => m.parentId === id)
        children.forEach(child => deleteRecursive(child.id))
      }
      deleteRecursive(menuId)
    },

    addRole(role: Role) {
      this.roles.push(role)
    },

    updateRole(role: Role) {
      const index = this.roles.findIndex(r => r.id === role.id)
      if (index !== -1) {
        this.roles[index] = role
      }
    },

    deleteRole(roleId: string) {
      const index = this.roles.findIndex(r => r.id === roleId)
      if (index !== -1) {
        this.roles.splice(index, 1)
      }
    },

    addUser(user: User) {
      this.users.push(user)
    },

    updateUser(user: User) {
      const index = this.users.findIndex(u => u.id === user.id)
      if (index !== -1) {
        this.users[index] = user
      }
    },

    deleteUser(userId: string) {
      const index = this.users.findIndex(u => u.id === userId)
      if (index !== -1) {
        this.users.splice(index, 1)
      }
    },

    reset() {
      this.menus = []
      this.roles = []
      this.users = []
      this.apiPermissions = []
      this.currentUserPermissions = []
      this.currentUserRole = null
    }
  }
})
