
import { computed, onBeforeMount, reactive, toRaw, unref, type MaybeRef, type ShallowReactive } from 'vue'
import type { SearchFormProps } from '@/components/form/search-form.ts'

export type UseSearchFormProps={
  manual?:boolean,
  formProps?:MaybeRef<Partial<SearchFormProps>>
}

export const useSearchForm = (props:UseSearchFormProps) => {
  const formProps=unref(props.formProps||{})
  const tableActionRef:any={current:{
    request:()=>{},
    refresh:()=>{},
  }}
  const onSubmit=(e:any)=>{
    formProps.onSubmit?.(e)
    tableActionRef.current.request({...formData})
  }
  const onReset=(e:any)=>{
    formProps.onReset?.(e)
    tableActionRef.current.request({...formData})
  }
  const formData=reactive(formProps.columns.reduce((prev,cur)=>{
      if(cur.name&&!Object.hasOwn(prev,cur.name)){
         prev[cur.name]=undefined
      }
      return prev
    },formProps.data||{}))

  const searchFormProps=computed(()=>{
    return {
        ...unref(props.formProps),
        data:formData,
        onSubmit:onSubmit,
        onReset:onReset,
    }
  })
  onBeforeMount(()=>{
    if(!props.manual){
      tableActionRef.current.request({...formData})
    }
  })
  return [searchFormProps,{tableActionRef}] as const
}