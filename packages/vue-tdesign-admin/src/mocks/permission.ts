import type { Menu, Role, User, ApiPermission, ButtonPermission } from '@/types/permission'

export const mockMenus: Menu[] = [
  {
    id: '1',
    name: '仪表盘',
    code: 'dashboard',
    icon: 'dashboard',
    path: '/new/system/dashboard',
    type: 'menu',
    sort: 1,
    status: 1,
    permission: 'dashboard:view'
  },
  {
    id: '2',
    name: '系统管理',
    code: 'system',
    icon: 'setting',
    path: '/new/system/system',
    type: 'directory',
    sort: 2,
    status: 1,
    children: [
      {
        id: '2-1',
        name: '用户管理',
        code: 'system:user',
        icon: 'user',
        path: '/new/system/user',
        parentId: '2',
        type: 'menu',
        sort: 1,
        status: 1,
        permission: 'system:user:list',
        children: [
          {
            id: '2-1-1',
            name: '用户查询',
            code: 'system:user:query',
            parentId: '2-1',
            type: 'button',
            sort: 1,
            status: 1,
            permission: 'system:user:query'
          },
          {
            id: '2-1-2',
            name: '用户新增',
            code: 'system:user:add',
            parentId: '2-1',
            type: 'button',
            sort: 2,
            status: 1,
            permission: 'system:user:add'
          },
          {
            id: '2-1-3',
            name: '用户编辑',
            code: 'system:user:edit',
            parentId: '2-1',
            type: 'button',
            sort: 3,
            status: 1,
            permission: 'system:user:edit'
          },
          {
            id: '2-1-4',
            name: '用户删除',
            code: 'system:user:delete',
            parentId: '2-1',
            type: 'button',
            sort: 4,
            status: 1,
            permission: 'system:user:delete'
          },
          {
            id: '2-1-5',
            name: '用户导出',
            code: 'system:user:export',
            parentId: '2-1',
            type: 'button',
            sort: 5,
            status: 1,
            permission: 'system:user:export'
          }
        ]
      },
      {
        id: '2-2',
        name: '角色管理',
        code: 'system:role',
        icon: 'user-group',
        path: '/new/system/role',
        parentId: '2',
        type: 'menu',
        sort: 2,
        status: 1,
        permission: 'system:role:list',
        children: [
          {
            id: '2-2-1',
            name: '角色新增',
            code: 'system:role:add',
            parentId: '2-2',
            type: 'button',
            sort: 1,
            status: 1,
            permission: 'system:role:add'
          },
          {
            id: '2-2-2',
            name: '角色编辑',
            code: 'system:role:edit',
            parentId: '2-2',
            type: 'button',
            sort: 2,
            status: 1,
            permission: 'system:role:edit'
          },
          {
            id: '2-2-3',
            name: '角色删除',
            code: 'system:role:delete',
            parentId: '2-2',
            type: 'button',
            sort: 3,
            status: 1,
            permission: 'system:role:delete'
          }
        ]
      },
      {
        id: '2-3',
        name: '菜单管理',
        code: 'system:menu',
        icon: 'menu',
        path: '/new/system/menu',
        parentId: '2',
        type: 'menu',
        sort: 3,
        status: 1,
        permission: 'system:menu:list',
        children: [
          {
            id: '2-3-1',
            name: '菜单新增',
            code: 'system:menu:add',
            parentId: '2-3',
            type: 'button',
            sort: 1,
            status: 1,
            permission: 'system:menu:add'
          },
          {
            id: '2-3-2',
            name: '菜单编辑',
            code: 'system:menu:edit',
            parentId: '2-3',
            type: 'button',
            sort: 2,
            status: 1,
            permission: 'system:menu:edit'
          },
          {
            id: '2-3-3',
            name: '菜单删除',
            code: 'system:menu:delete',
            parentId: '2-3',
            type: 'button',
            sort: 3,
            status: 1,
            permission: 'system:menu:delete'
          }
        ]
      },
      {
        id: '2-4',
        name: '按钮权限',
        code: 'system:button',
        icon: 'lock',
        path: '/new/system/button',
        parentId: '2',
        type: 'menu',
        sort: 4,
        status: 1,
        permission: 'system:button:list'
      },
      {
        id: '2-5',
        name: 'API权限',
        code: 'system:api',
        icon: 'link',
        path: '/new/system/api',
        parentId: '2',
        type: 'menu',
        sort: 5,
        status: 1,
        permission: 'system:api:list'
      },
      {
        id: '2-6',
        name: '部门管理',
        code: 'system:dept',
        icon: 'organization',
        path: '/new/system/dept',
        parentId: '2',
        type: 'menu',
        sort: 6,
        status: 1,
        permission: 'system:dept:list'
      },
      {
        id: '2-7',
        name: '字典管理',
        code: 'system:dict',
        icon: 'books',
        path: '/new/system/dict',
        parentId: '2',
        type: 'menu',
        sort: 7,
        status: 1,
        permission: 'system:dict:list'
      },
      {
        id: '2-8',
        name: '日志管理',
        code: 'system:log',
        icon: 'text',
        path: '/new/system/log',
        parentId: '2',
        type: 'menu',
        sort: 8,
        status: 1,
        permission: 'system:log:list'
      }
    ]
  }
]

export const mockRoles: Role[] = [
  {
    id: '1',
    name: '超级管理员',
    code: 'admin',
    description: '拥有系统所有权限',
    status: 1,
    menuIds: ['1', '2', '2-1', '2-2', '2-3', '2-4', '2-5', '2-6', '2-7', '2-8'],
    buttonPermissions: [
      'dashboard:view',
      'system:user:list',
      'system:user:query',
      'system:user:add',
      'system:user:edit',
      'system:user:delete',
      'system:user:export',
      'system:role:list',
      'system:role:add',
      'system:role:edit',
      'system:role:delete',
      'system:menu:list',
      'system:menu:add',
      'system:menu:edit',
      'system:menu:delete',
      'system:button:list',
      'system:api:list',
      'system:dept:list',
      'system:dict:list',
      'system:log:list'
    ],
    apiPermissions: [],
    dataScope: 1,
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00'
  },
  {
    id: '2',
    name: '普通管理员',
    code: 'manager',
    description: '拥有部分管理权限',
    status: 1,
    menuIds: ['1', '2', '2-1', '2-2'],
    buttonPermissions: [
      'dashboard:view',
      'system:user:list',
      'system:user:query',
      'system:user:add',
      'system:user:edit',
      'system:role:list'
    ],
    apiPermissions: [],
    dataScope: 2,
    createdAt: '2024-01-02 00:00:00',
    updatedAt: '2024-01-02 00:00:00'
  },
  {
    id: '3',
    name: '普通用户',
    code: 'user',
    description: '普通用户权限',
    status: 1,
    menuIds: ['1'],
    buttonPermissions: ['dashboard:view'],
    apiPermissions: [],
    dataScope: 5,
    createdAt: '2024-01-03 00:00:00',
    updatedAt: '2024-01-03 00:00:00'
  }
]

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    name: '超级管理员',
    avatar: 'https://tdesign.gtimg.com/site/avatar.jpg',
    email: 'admin@example.com',
    phone: '13800138000',
    status: 1,
    roleIds: ['1'],
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00'
  },
  {
    id: '2',
    username: 'manager',
    name: '普通管理员',
    avatar: 'https://tdesign.gtimg.com/site/avatar.jpg',
    email: 'manager@example.com',
    phone: '13800138001',
    status: 1,
    roleIds: ['2'],
    createdAt: '2024-01-02 00:00:00',
    updatedAt: '2024-01-02 00:00:00'
  },
  {
    id: '3',
    username: 'user',
    name: '普通用户',
    avatar: 'https://tdesign.gtimg.com/site/avatar.jpg',
    email: 'user@example.com',
    phone: '13800138002',
    status: 1,
    roleIds: ['3'],
    createdAt: '2024-01-03 00:00:00',
    updatedAt: '2024-01-03 00:00:00'
  }
]

export const mockApiPermissions: ApiPermission[] = [
  {
    id: '1',
    name: '用户列表',
    code: 'api:user:list',
    path: '/api/users',
    method: 'GET',
    module: '用户管理',
    description: '获取用户列表'
  },
  {
    id: '2',
    name: '用户详情',
    code: 'api:user:detail',
    path: '/api/users/:id',
    method: 'GET',
    module: '用户管理',
    description: '获取用户详情'
  },
  {
    id: '3',
    name: '新增用户',
    code: 'api:user:add',
    path: '/api/users',
    method: 'POST',
    module: '用户管理',
    description: '新增用户'
  },
  {
    id: '4',
    name: '更新用户',
    code: 'api:user:update',
    path: '/api/users/:id',
    method: 'PUT',
    module: '用户管理',
    description: '更新用户'
  },
  {
    id: '5',
    name: '删除用户',
    code: 'api:user:delete',
    path: '/api/users/:id',
    method: 'DELETE',
    module: '用户管理',
    description: '删除用户'
  },
  {
    id: '6',
    name: '角色列表',
    code: 'api:role:list',
    path: '/api/roles',
    method: 'GET',
    module: '角色管理',
    description: '获取角色列表'
  },
  {
    id: '7',
    name: '新增角色',
    code: 'api:role:add',
    path: '/api/roles',
    method: 'POST',
    module: '角色管理',
    description: '新增角色'
  },
  {
    id: '8',
    name: '更新角色',
    code: 'api:role:update',
    path: '/api/roles/:id',
    method: 'PUT',
    module: '角色管理',
    description: '更新角色'
  },
  {
    id: '9',
    name: '删除角色',
    code: 'api:role:delete',
    path: '/api/roles/:id',
    method: 'DELETE',
    module: '角色管理',
    description: '删除角色'
  }
]

export const mockButtonPermissions: ButtonPermission[] = [
  {
    id: '1',
    name: '用户查询',
    code: 'system:user:query',
    menuId: '2-1'
  },
  {
    id: '2',
    name: '用户新增',
    code: 'system:user:add',
    menuId: '2-1'
  },
  {
    id: '3',
    name: '用户编辑',
    code: 'system:user:edit',
    menuId: '2-1'
  },
  {
    id: '4',
    name: '用户删除',
    code: 'system:user:delete',
    menuId: '2-1'
  },
  {
    id: '5',
    name: '用户导出',
    code: 'system:user:export',
    menuId: '2-1'
  },
  {
    id: '6',
    name: '角色新增',
    code: 'system:role:add',
    menuId: '2-2'
  },
  {
    id: '7',
    name: '角色编辑',
    code: 'system:role:edit',
    menuId: '2-2'
  },
  {
    id: '8',
    name: '角色删除',
    code: 'system:role:delete',
    menuId: '2-2'
  },
  {
    id: '9',
    name: '菜单新增',
    code: 'system:menu:add',
    menuId: '2-3'
  },
  {
    id: '10',
    name: '菜单编辑',
    code: 'system:menu:edit',
    menuId: '2-3'
  },
  {
    id: '11',
    name: '菜单删除',
    code: 'system:menu:delete',
    menuId: '2-3'
  }
]
