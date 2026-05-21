
import { defineStore,storeToRefs } from 'pinia'
import { ref ,reactive, computed} from 'vue'


export const useAppStore = defineStore('global', ()=>{
    const re=ref('')
    const state=reactive({age:0})
    const aaa=computed(()=>'fff')
    return {
        re,
        state,
        aaa
    }
})
