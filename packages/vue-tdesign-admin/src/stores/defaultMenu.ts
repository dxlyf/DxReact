import { defineStore } from 'pinia'

export interface MenuItem {
  path?: string
  menuKey?: string
  menuName?: string
  hideMenu?: boolean
  icon?: string
  parentKeys?: string[]
  children?: MenuItem[]
  permission?: string | string[]
}

const defaultMenus: MenuItem[] = [
  {
    path: '/new/system',
    menuKey: '/system',
    menuName: '系统管理',
    icon: 'setting',
    children: [
      {
        path: '/new/system/user',
        menuKey: '/new/system/user',
        menuName: '用户管理',
        icon: 'user',
        permission: ['system:user:list']
      },
      {
        path: '/new/system/role',
        menuKey: '/new/system/role',
        menuName: '角色管理',
        icon: 'user-group',
        permission: ['system:role:list']
      },
      {
        path: '/new/system/menu',
        menuKey: '/new/system/menu',
        menuName: '菜单管理',
        icon: 'menu',
        permission: ['system:menu:list']
      },
      {
        path: '/new/system/button',
        menuKey: '/new/system/button',
        menuName: '按钮权限',
        icon: 'lock',
        permission: ['system:button:list']
      },
      {
        path: '/new/system/api',
        menuKey: '/new/system/api',
        menuName: 'API权限',
        icon: 'link',
        permission: ['system:api:list']
      },
      {
        path: '/new/system/dept',
        menuKey: '/new/system/dept',
        menuName: '部门管理',
        icon: 'organization',
        permission: ['system:dept:list']
      },
      {
        path: '/new/system/dict',
        menuKey: '/new/system/dict',
        menuName: '字典管理',
        icon: 'books',
        permission: ['system:dict:list']
      },
      {
        path: '/new/system/log',
        menuKey: '/new/system/log',
        menuName: '日志管理',
        icon: 'text',
        permission: ['system:log:list']
      }
    ]
  }
]

export const useDefaultMenuStore = defineStore('defaultMenu', {
  state: () => ({
    items: [] as MenuItem[],
    activeKey: '',
    expandedKeys: [] as string[]
  }),

  getters: {
    flatItems(state): MenuItem[] {
      const result: MenuItem[] = []
      const walk = (list: MenuItem[]) => {
        for (const item of list) {
          result.push(item)
          if (item.children) walk(item.children)
        }
      }
      walk(state.items)
      return result
    }
  },

  actions: {
    init() {
      this.items = defaultMenus
    },

    setActiveKey(key: string) {
      this.activeKey = key
    },

    setExpandedKeys(keys: string[]) {
      this.expandedKeys = keys
    },

    syncByRoute(meta: Record<string, any>) {
      const menuKey = meta.menuKey as string | undefined
      if (menuKey) {
        const item = this.flatItems.find(m => m.menuKey === menuKey)
        if (item) {
          this.activeKey = menuKey
          for (const k of item.parentKeys ?? []) {
            if (!this.expandedKeys.includes(k)) {
              this.expandedKeys.push(k)
            }
          }
        }
      }

      const parentKey = meta.parentMenuKey as string | undefined
      if (parentKey && !this.expandedKeys.includes(parentKey)) {
        this.expandedKeys.push(parentKey)
      }
    }
  }
})
