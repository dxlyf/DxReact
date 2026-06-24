import { defineStore } from 'pinia'

export const useAppStore = defineStore('app',()=>{

    const initialized=ref(false)
    const initialize=async()=>{
        if(initialized.value){
            return
        }
        initialized.value=true
    }
    return {initialized,initialize}
})
