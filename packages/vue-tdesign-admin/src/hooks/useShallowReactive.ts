import {shallowReactive} from 'vue'
import {cloneDeep,} from 'lodash-es'
export const useShallowReactive=<T extends Record<string,unknown>>(value:T)=>{
    const initialValue=cloneDeep(value)
    const current= shallowReactive<T>(value)

    const reset=()=>{
        Object.assign(current,initialValue)
    }
    const clear=()=>{
        Object.keys(current).forEach((key)=>{
            delete current[key]
       })
    }
    return [current,{reset,clear}]
}