import { defineStore } from 'pinia'
import type { UserInfo, LoginParams, LoginResult } from '@/types/user'
import { loginApi, logoutApi, getUserInfoApi } from '@/api/modules/auth'
import { clearToken, setToken } from '@/utils/token'

interface AuthState {
  token: string | null
  user: UserInfo | null
  permissionsLoaded: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    user: null,
    permissionsLoaded: false,
  }),

  getters: {
    isLoggedIn: (state): boolean => !!state.token,
    isSuperAdmin: (state): boolean => state.user?.role === 'super_admin',
  },

  actions: {
    async login(params: LoginParams): Promise<LoginResult> {
      const res = await loginApi(params)
      setToken(res.token)
      this.token = res.token
      await this.fetchUserInfo()
      return res
    },

    async fetchUserInfo(): Promise<void> {
      const user = await getUserInfoApi()
      this.user = user
      this.permissionsLoaded = false
    },

    async logout(): Promise<void> {
      try {
        await logoutApi()
      } finally {
        this.reset()
        clearToken()
      }
    },

    reset(): void {
      this.token = null
      this.user = null
      this.permissionsLoaded = false
    },
  },
})
