import { defineStore } from 'pinia'
import {useUserStore} from './userStore'
export const useAppStore = defineStore('app',()=>{

    const userStore=useUserStore()
    const initialized=ref(false)
    
    const currentUser=computed(()=>{
        return userStore.userInfo
    })
    const initialize=async()=>{
        if(initialized.value){
            return
        }
        initialized.value=true
    }
    return {initialized,initialize}
})
