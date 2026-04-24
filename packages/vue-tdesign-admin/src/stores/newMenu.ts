import { defineStore } from 'pinia'
import type { Menu } from '@/types/permission'

export interface TabItem {
  path: string
  name: string
  title: string
  closable: boolean
}

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

export const systemAdminMenus: MenuItem[] = [
  {
    path: 'new/system',
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

export const useNewMenuStore = defineStore('newMenu', {
  state: () => ({
    menuData: [] as MenuItem[],
    collapsed: false,
    activeMenuKey: '',
    expandedKeys: [] as string[],
    tabs: [] as TabItem[],
    activeTab: '',
    userPermissions: [] as string[]
  }),
  getters: {
    flatMenuData: (state) => {
      const result: MenuItem[] = []
      const flatten = (items: MenuItem[]) => {
        items.forEach(item => {
          result.push(item)
          if (item.children) {
            flatten(item.children)
          }
        })
      }
      flatten(state.menuData)
      return result
    }
  },
  actions: {
    initMenuData() {
      this.menuData =systemAdminMenus
    },
    
    mergeMenus(baseMenus: MenuItem[], additionalMenus: MenuItem[]): MenuItem[] {
      const result = [...baseMenus]
      
      for (const menu of additionalMenus) {
        const existingIndex = result.findIndex(m => m.menuKey === menu.menuKey)
        if (existingIndex !== -1) {
          const existingMenu = result[existingIndex]
          if (existingMenu.children && menu.children) {
            existingMenu.children = this.mergeMenus(existingMenu.children, menu.children)
          }
        } else {
          result.push(menu)
        }
      }
      
      return result
    },
    
    setCollapsed(collapsed: boolean) {
      this.collapsed = collapsed
    },
    toggleCollapsed() {
      this.collapsed = !this.collapsed
    },
    setActiveMenuKey(key: string) {
      this.activeMenuKey = key
    },
    toggleExpanded(key: string) {
      const index = this.expandedKeys.indexOf(key)
      if (index > -1) {
        this.expandedKeys.splice(index, 1)
      } else {
        this.expandedKeys.push(key)
      }
    },
    setExpandedKeys(keys: string[]) {
      this.expandedKeys = keys
    },
    addExpandedKey(key: string) {
      if (!this.expandedKeys.includes(key)) {
        this.expandedKeys.push(key)
      }
    },
    addTab(tab: TabItem) {
      const existingTab = this.tabs.find(t => t.path === tab.path)
      if (!existingTab) {
        this.tabs.push(tab)
      }
      this.activeTab = tab.path
    },
    removeTab(path: string) {
      const index = this.tabs.findIndex(tab => tab.path === path)
      if (index > -1) {
        this.tabs.splice(index, 1)
        if (this.activeTab === path) {
          const nextTab = this.tabs[index] || this.tabs[index - 1]
          this.activeTab = nextTab ? nextTab.path : ''
        }
      }
    },
    setActiveTab(path: string) {
      this.activeTab = path
    },
    clearTabs() {
      this.tabs = []
      this.activeTab = ''
    },
    setUserPermissions(permissions: string[]) {
      this.userPermissions = permissions
    },
    filterMenuByPermission() {
      const filter = (items: MenuItem[]): MenuItem[] => {
        return items.filter(item => {
          if (item.permission) {
            const perms = Array.isArray(item.permission) ? item.permission : [item.permission]
            const hasPermission = perms.some(p => this.userPermissions.includes(p))
            if (!hasPermission) return false
          }
          if (item.children) {
            item.children = filter(item.children)
          }
          return true
        })
      }
      this.menuData = filter(JSON.parse(JSON.stringify(systemAdminMenus)) as MenuItem[])
    },
    findMenuItemByKey(menuKey: string): MenuItem | undefined {
      return this.flatMenuData.find(item => item.menuKey === menuKey)
    },
    syncMenuStateByRoute(meta: { menuKey?: string; parentMenuKey?: string; title?: string; path?: string; name?: string }) {
      if (meta.menuKey) {
        const menuItem = this.findMenuItemByKey(meta.menuKey)
        if (menuItem) {
          this.activeMenuKey = meta.menuKey
          if (menuItem.parentKeys) {
            menuItem.parentKeys.forEach(key => {
              this.addExpandedKey(key)
            })
          }
        } else if (meta.parentMenuKey) {
          this.addExpandedKey(meta.parentMenuKey)
        }
      }
    }
  }
})