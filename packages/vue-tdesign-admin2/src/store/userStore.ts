
import { defineStore } from 'pinia'

type UserInfo = {
    username: string
    avatar: string
    isSuperAdmin: boolean
}
type UserStore={
    userInfo: UserInfo | null
}
export const useUserStore = defineStore<'user', UserStore>('user', {
    state: () => ({
         userInfo: null
    }),
    getters: {
     
    },
    actions: {
      async getCurrentUserInfo(){
        return {
            username:'admin',
            avatar:'',
            isSuperAdmin: true
        } as UserInfo
      },
      async login(username:string, password:string){
           if(username === 'admin' && password === '123456'){
                
           }
      }
    }
})
