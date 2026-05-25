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

    menuKey: 'downloadcenter',
    menuName: '下载中心',
    icon: 'setting',
    children:[
      {
        menuKey:'app',
        menuName:'应用',
        icon:'app',
        path:'/example/tdesign/download/apps'
      }
    ]
  },{
     menuKey: 'product',
    menuName: '产品',
    icon: 'setting',
    children:[
      {
        menuKey:'product-features',
        menuName:'产品特性',
        icon:'app',
        path:'/example/tdesign/product_comparison/product-features'
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
