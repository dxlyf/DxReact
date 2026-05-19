import type { MockMethod } from 'vite-plugin-mock'

const menusByTenant: Record<string, any[]> = {
  t1: [
    {
      id: 'm1', parentId: null, name: 'Dashboard', path: '/dashboard', title: '仪表盘', icon: 'dashboard', hidden: false, keepAlive: true, order: 1,
    },
    {
      id: 'm2', parentId: null, name: 'UserMgr', path: '/user', title: '用户管理', icon: 'user', hidden: false, keepAlive: false, order: 2,
      children: [
        { id: 'm2-1', parentId: 'm2', name: 'UserList', path: '/user/list', title: '用户列表', component: 'user', permission: 'user:read', hidden: false, keepAlive: false, order: 1 },
      ],
    },
    {
      id: 'm3', parentId: null, name: 'RoleMgr', path: '/role', title: '角色管理', icon: 'usergroup', hidden: false, keepAlive: false, order: 3,
      children: [
        { id: 'm3-1', parentId: 'm3', name: 'RoleList', path: '/role/list', title: '角色列表', component: 'role', permission: 'role:read', hidden: false, keepAlive: false, order: 1 },
      ],
    },
    {
      id: 'm4', parentId: null, name: 'Settings', path: '/settings', title: '系统设置', icon: 'setting', hidden: false, keepAlive: false, order: 4,
    },
  ],
  t2: [
    {
      id: 'm1', parentId: null, name: 'Dashboard', path: '/dashboard', title: '仪表盘', icon: 'dashboard', hidden: false, keepAlive: true, order: 1,
    },
    {
      id: 'm2', parentId: null, name: 'UserMgr', path: '/user', title: '用户管理', icon: 'user', hidden: false, keepAlive: false, order: 2,
      children: [
        { id: 'm2-1', parentId: 'm2', name: 'UserList', path: '/user/list', title: '用户列表', component: 'user', permission: 'user:read', hidden: false, keepAlive: false, order: 1 },
      ],
    },
  ],
}

export default [
  {
    url: '/api/menus',
    method: 'get',
    response: ({ query }: any) => {
      const menus = menusByTenant[query.tenantId] || []
      return { code: 0, message: 'ok', data: menus, traceId: '' }
    },
  },
] as MockMethod[]
