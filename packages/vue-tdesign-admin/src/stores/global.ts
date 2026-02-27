
import { defineStore } from 'pinia'
import { ref ,reactive} from 'vue'


const useGlobalStore = defineStore('global', ()=>{
    const re=ref('')
    const state=reactive({age:0})
    return {
        re,
        state
    }
})
const g=useGlobalStore()
