import { defineStore } from 'pinia'

export interface MenuItem {
  path: string
  icon: string
  title: string
  children?: MenuItem[]
}

export const menuData: MenuItem[] = [
  {
    path: '/dashboard',
    icon: 'dashboard',
    title: '仪表盘'
  },
  {
    path: '/users',
    icon: 'user',
    title: '用户管理'
  },
  {
    path: '/example',
    icon: 'table',
    title: '示例',
    children: [
      {
        path: '/example/components',
        icon: 'table',
        title: '组件',
        children: [
          {
            path: '/example/components/comps',
            icon: 'table',
            title: '组件集合'
          },{
            path: '/example/components/list',
            icon: 'table',
            title: '列表'
          }
        ]
      }
    ]
  },
  {
    path: '/system',
    icon: 'setting',
    title: '系统管理',
    children: [
      {
        icon: 'usergroup',
        title: '角色管理',
        path: '/system/role'
      },
      {
        path: '/system/permission',
        icon: 'lock-on',
        title: '权限管理'
      }
    ]
  },
  {
    path: '/settings',
    icon: 'setting',
    title: '设置'
  }
]

export const useMenu = defineStore('menu', {
  state: () => ({
    menuData: menuData as MenuItem[]
  })
 
})
