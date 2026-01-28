import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: {
      name: '管理员',
      role: 'admin'
    },
    token: ''
  }),
  getters: {
    isLoggedIn: (state) => !!state.token
  },
  actions: {
    login(token: string, userInfo: any) {
      this.token = token
      this.userInfo = userInfo
    },
    logout() {
      this.token = ''
      this.userInfo = {
        name: '',
        role: ''
      }
    }
  }
})