import { inject,provide } from "vue"
export {default as PageProvider} from './index.vue'
const PAGE_PROVIDER_KEY=Symbol('pageProvider')

export type PageProviderContext={
    title:string,
}
export const initPageProvider=(config:PageProviderContext)=>{
    provide<PageProviderContext>(PAGE_PROVIDER_KEY,config)
}
export const usePageContext=()=>{
    return inject<PageProviderContext>(PAGE_PROVIDER_KEY)
}