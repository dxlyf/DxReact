export interface MenuItem {
  path: string
  name: string
  icon: string
  title: string
  children?: MenuItem[]
}

export const menuItems: MenuItem[] = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    icon: 'dashboard',
    title: '仪表盘'
  },
  {
    path: '/users',
    name: 'Users',
    icon: 'user',
    title: '用户管理'
  },
  {
    path: '/system',
    name: 'System',
    icon: 'setting',
    title: '系统管理',
    children: [
      {
        path: '/system/role',
        name: 'Role',
        icon: 'usergroup',
        title: '角色管理'
      },
      {
        path: '/system/permission',
        name: 'Permission',
        icon: 'lock-on',
        title: '权限管理'
      }
    ]
  },
  {
    path: '/settings',
    name: 'Settings',
    icon: 'setting',
    title: '设置'
  }
]
