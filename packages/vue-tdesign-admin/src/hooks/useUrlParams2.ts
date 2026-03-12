
import { shallowReactive, shallowRef } from 'vue'
import {useRoute,useRouter} from 'vue-router'
type UseUrlParamsOptions={
    fields?:Record<string,any>
}
export const useUrlparams=(options:UseUrlParamsOptions={})=>{
    const {fields={}}=options

    const route=useRoute()
    const router=useRouter()
    const params={...route.query}
    Object.keys(fields).forEach(key=>{
        params[key]=fields[key]
    })
    const updateParams=(newParams:Record<string,any>)=>{
        // params.value={
        //     ...newParams
        // }
        router.replace({
            query:{
                ...params,
                ...newParams
            }
        })
    }
    return {
        params,
        updateParams
    }
}