import { defineStore } from 'pinia'


export const useAppStore = defineStore('app', {
    state: () => ({
        initialized: false,
    }),
    getters: {
        getInitialized(state){
            return state.initialized
        }
    },
    actions: {
        async initialize(){
            this.initialized = true
        }
    }
})
