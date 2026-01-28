import { defineStore } from 'pinia'

export interface TabItem {
  path: string
  name: string
  title: string
  closable: boolean
}

export const useTabsStore = defineStore('tabs', {
  state: () => ({
    tabs: [] as TabItem[],
    activeTab: '' as string
  }),
  getters: {
    currentTab: (state) => state.tabs.find(tab => tab.path === state.activeTab)
  },
  actions: {
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
    }
  }
})
