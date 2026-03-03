
import { defineStore,storeToRefs } from 'pinia'
import { ref ,reactive, computed} from 'vue'


const useGlobalStore = defineStore('global', ()=>{
    const re=ref('')
    const state=reactive({age:0})
    const aaa=computed(()=>'fff')
    return {
        re,
        state,
        aaa
    }
})
