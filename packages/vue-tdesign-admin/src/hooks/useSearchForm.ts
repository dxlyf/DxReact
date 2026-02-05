
import { computed, onBeforeMount, shallowReactive, toRef, toValue, type MaybeRefOrGetter } from 'vue'
import type { SearchFormProps } from '@/components/form/search-form.ts'
import type { F } from 'vue-router/dist/router-CWoNjPRp.mjs'

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
  const onSubmit:SearchFormProps['onSubmit']=(e:any)=>{
    formProps.value.onSubmit?.(e)
    tableActionRef.current.request({...formData})
  }
  const onReset:SearchFormProps['onReset']=(e:any)=>{
    formProps.value.onReset?.(e)
    tableActionRef.current.request({...formData})
  }
  const formData=shallowReactive({...formProps.value.data||{}})

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
  return [searchFormProps,{tableActionRef,formData}] as const
}