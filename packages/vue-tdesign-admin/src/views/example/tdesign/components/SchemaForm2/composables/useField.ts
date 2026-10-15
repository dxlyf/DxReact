
import { getDeepValue, setDeepValue } from '../util'
import  {USE_Schema_CONTEXT_KEY,type UseSchemaFormInstance  } from './useSchemaForm'
import  { useVModel } from './useVModel'
import { computed, inject } from 'vue'
import type { AllFieldSchema, AtomFieldSchema, FieldPath } from '../types'
export type UseFieldProps={
    Schema:AllFieldSchema
    path:FieldPath
}
export const useField=(props:UseFieldProps)=>{
    const ctx=inject<UseSchemaFormInstance>(USE_Schema_CONTEXT_KEY,null)
    if(!ctx){
        throw new Error('useField must be used within a SchemaForm')
    }
    const model= computed({
        get:()=>ctx.getValue(props.path,props.Schema.defaultValue),
        set:(value)=>ctx.setValue(props.path,value)
    })
    const fields=computed(()=>{
         const type=props.Schema.type
         const value=model.value
         if(type==='array'){
            const Schemas=props.Schema.Schemas as AllFieldSchema[]
            return Schemas
         }
         else if(type==='object'){
            return props.Schema.Schemas
         }
         else {
            return [props.Schema]
         }
    })
    const createItem=()=>{
        if(props.Schema.type==='array'){
            return {}
        }
        else if(props.Schema.type==='object'){
            return {}
        }
        else {
            return props.Schema.defaultValue
        }
    }
    const getFieldSchema=(key:string)=>{

    }
    return [model] as const
}