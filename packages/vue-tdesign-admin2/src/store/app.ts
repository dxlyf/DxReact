import { defineStore } from 'pinia'
import { getToken } from '@/utils/token'
import { useAuthStore } from '@/store/auth'

interface AppState {
  sidebarCollapsed: boolean
  locale: string
  theme: 'light' | 'dark'
  initialized: boolean
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    sidebarCollapsed: false,
    locale: 'zh-CN',
    theme: 'light',
    initialized: false,
  }),

  actions: {
    async initApp(): Promise<void> {
      if(this.initialized){
        return
      }
      await new Promise(resolve => setTimeout(resolve, 3000))
      this.initialized = true
    },
    toggleSidebar(): void {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },

    setLocale(locale: string): void {
      this.locale = locale
    },

    setTheme(theme: 'light' | 'dark'): void {
      this.theme = theme
    },
  },
})
