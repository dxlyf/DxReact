
import { computed, onBeforeMount, shallowReactive, toRef, toValue, type MaybeRefOrGetter } from 'vue'
import type { SearchFormProps } from '@/components/form/search-form.ts'

export type UseSearchFormProps={
  manual?:boolean,
  formProps?:Partial<SearchFormProps>
}

export const useSearchForm = (props:MaybeRefOrGetter<UseSearchFormProps>) => {
  const propsRef=computed(()=>toValue(props))
  const formProps=toRef(()=>propsRef.value.formProps||{})
  const tableActionRef:any={current:{
    request:()=>{},
    refresh:()=>{},
  }}
  const onSubmit=(e:any)=>{
    formProps.value.onSubmit?.(e)
    tableActionRef.current.request({...formData})
  }
  const onReset=(e:any)=>{
    formProps.value.onReset?.(e)
    tableActionRef.current.request({...formData})
  }
  const formData=shallowReactive(formProps.value.columns.reduce((prev,cur)=>{
      if(cur.name&&!Object.hasOwn(prev,cur.name)){
         prev[cur.name]=undefined
      }
      return prev
    },formProps.value.data||{}))

  const searchFormProps=computed(()=>{
    return {
        ...formProps.value,
        data:formData,
        onSubmit:onSubmit,
        onReset:onReset,
    }
  })
  onBeforeMount(()=>{
    if(!propsRef.value.manual){
      tableActionRef.current.request({...formData})
    }
  })
  return [searchFormProps,{tableActionRef}] as const
}