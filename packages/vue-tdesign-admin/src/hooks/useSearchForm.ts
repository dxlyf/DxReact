
import { computed, reactive, type ShallowReactive } from 'vue'
import type { SearchFormProps } from '@/components/form/search-form.ts'

export type UseSearchFormProps={

}&Omit<SearchFormProps,'modelValue'>

export const useSearchForm = (props:ShallowReactive<UseSearchFormProps>|UseSearchFormProps) => {
  const onSubmit=(e:any)=>{
    props.onSubmit?.(e)
  }
  const onReset=(e:any)=>{
    props.onReset?.(e)
  }
  const _formData=reactive(props.columns.reduce((prev,cur)=>{
      if(cur.name){
         prev[cur.name]=undefined
      }
      return prev
    },{} as any))

  const searchFormProps=computed(()=>{
     
    return {
        ...props,
        data:props.data?props.data:_formData,
        onSubmit:onSubmit,
        onReset:onReset,
    }
  })
  return [searchFormProps] as const
}