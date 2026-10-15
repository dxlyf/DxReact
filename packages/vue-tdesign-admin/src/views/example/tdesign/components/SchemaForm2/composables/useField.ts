
import { getDeepValue, setDeepValue } from '../util'
import  {USE_SCHEME_CONTEXT_KEY,type UseSchemeFormInstance  } from './useSchemeForm'
import  { useVModel } from './useVModel'
import { computed, inject } from 'vue'
import type { AllFieldScheme, AtomFieldScheme, FieldPath } from '../types'
export type UseFieldProps={
    scheme:AllFieldScheme
    path:FieldPath
}
export const useField=(props:UseFieldProps)=>{
    const ctx=inject<UseSchemeFormInstance>(USE_SCHEME_CONTEXT_KEY,null)
    if(!ctx){
        throw new Error('useField must be used within a SchemaForm')
    }
    const model= computed({
        get:()=>ctx.getValue(props.path,props.scheme.defaultValue),
        set:(value)=>ctx.setValue(props.path,value)
    })
    const fields=computed(()=>{
         const type=props.scheme.type
         const value=model.value
         if(type==='array'){
            const schemes=props.scheme.schemes as AllFieldScheme[]
            return schemes
         }
         else if(type==='object'){
            return props.scheme.schemes
         }
         else {
            return [props.scheme]
         }
    })
    const createItem=()=>{
        if(props.scheme.type==='array'){
            return {}
        }
        else if(props.scheme.type==='object'){
            return {}
        }
        else {
            return props.scheme.defaultValue
        }
    }
    const getFieldScheme=(key:string)=>{

    }
    return [model] as const
}