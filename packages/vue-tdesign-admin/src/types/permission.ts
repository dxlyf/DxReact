export interface User {
  id: string
  username: string
  name: string
  avatar?: string
  email?: string
  phone?: string
  status: 0 | 1
  roleIds: string[]
  createdAt: string
  updatedAt: string
}

export interface Role {
  id: string
  name: string
  code: string
  description?: string
  status: 0 | 1
  menuIds: string[]
  buttonPermissions: string[]
  apiPermissions: string[]
  dataScope: 1 | 2 | 3 | 4 | 5
  createdAt: string
  updatedAt: string
}

export interface Menu {
  id: string
  name: string
  code: string
  icon?: string
  path?: string
  component?: string
  parentId?: string
  type: 'directory' | 'menu' | 'button'
  sort: number
  status: 0 | 1
  children?: Menu[]
  permission?: string
  cache?: boolean
  visible?: boolean
}

export interface ApiPermission {
  id: string
  name: string
  code: string
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  module: string
  description?: string
}

export interface DataScope {
  id: string
  name: string
  code: string
  description?: string
}

export interface PermissionState {
  menus: Menu[]
  roles: Role[]
  users: User[]
  apiPermissions: ApiPermission[]
  currentUserPermissions: string[]
  currentUserRole: Role | null
}

export interface ButtonPermission {
  id: string
  name: string
  code: string
  menuId: string
}
