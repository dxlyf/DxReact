
import { defineStore } from 'pinia'
import { login, getCurrentUserInfo, type UserInfo } from '@/api/modules/user'

type UserStore = {
    userInfo: UserInfo | null
}
export const useUserStore = defineStore('user', {
    state: () => ({
        userInfo: null
    } as UserStore),
    getters: {

    },
    actions: {
        async getCurrentUserInfo() {
            const res = await getCurrentUserInfo()
            this.userInfo = res.data
        },
        async login(username: string, password: string) {
            const res = await login(username, password)
            if (res) {
                 return true
            }
            return false
        }
    }
})
