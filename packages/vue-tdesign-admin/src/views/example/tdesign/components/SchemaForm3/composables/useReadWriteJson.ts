import {type Ref,type ShallowRef,computed} from 'vue'
import { isObject,parseJsonObject,writeValidJson } from '../util'
import { TextareaProps } from 'tdesign-vue-next'

export const useReadWriteJson=<T=any>(obj:Ref<T>|ShallowRef<T>,getDefaultValue:()=>T)=>{
     const valueJson=computed({
        get(){
            try{
                const val=JSON.stringify(obj.value)
                return val
            }catch{
                return ''
            }
        },
        set(val:string){
            writeValidJson(val,getDefaultValue(),(value)=>{
                obj.value=value
            })
        }
     })
     const props=computed<TextareaProps>(()=>{
        return {
            value:valueJson.value,
            onBlur:(value,{e})=>{
               valueJson.value=(e.target as HTMLTextAreaElement).value as string
            }
        }
     })
     return [valueJson,props] as const;
}