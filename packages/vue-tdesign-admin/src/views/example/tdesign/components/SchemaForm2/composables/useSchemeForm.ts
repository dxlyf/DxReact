import { readonly,triggerRef,computed,watch, ref, toValue,markRaw,inject,provide, unref,type WritableComputedRef, type MaybeRefOrGetter, shallowRef, getCurrentInstance, onBeforeUnmount } from 'vue'
import { getDeepValue, setDeepValue,normalizeScheme,createItemByScheme } from '../util'
import type { FormScheme, FieldPath, AllFieldScheme } from '../types'

export type UseSchemeForm<T> = {
    value: T
    scheme:MaybeRefOrGetter<FormScheme>
}
export const USE_SCHEME_CONTEXT_KEY='USE_SCHEME_CONTEXT_KEY'
export const useSchemeForm = <T = any>(props: UseSchemeForm<T>) => {
 
    const ROOT_KEY='root'
    const localValue = shallowRef({
        [ROOT_KEY]:JSON.parse(JSON.stringify(props.value)) 
    })
    const propScheme=computed(()=>toValue(props.scheme))
    const scheme=computed<AllFieldScheme>(()=>{
        return normalizeScheme(toValue(props.scheme))
    })
    const getValue = (path:FieldPath,defaultValue?:any) => {
        return getDeepValue(localValue.value, ['root',...path],defaultValue)
    }
    const setValue = (path:FieldPath, value: any) => {
        setDeepValue(localValue.value, ['root',...path], value)
        localValue.value={
            [ROOT_KEY]:localValue.value[ROOT_KEY]
        }
    }
    const valueJson=shallowRef('')
    watch(localValue,(val)=>{
        valueJson.value=JSON.stringify(val[ROOT_KEY])
       
    },{
        immediate:true
    })
    const value=computed({
        get:()=>{
            return localValue.value[ROOT_KEY]
        },
        set:(val)=>{
            localValue.value={
                [ROOT_KEY]:val
            }
        }
    })
    const instance={
        value,
        valueJson,
        scheme,
        getValue,
        setValue   
    }
    return markRaw(instance)
}
export type UseSchemeFormInstance = ReturnType<typeof useSchemeForm>