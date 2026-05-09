import {onMounted,onUnmounted,ref,toValue,unref,toRaw,shallowRef,reactive,ShallowReactive,type MaybeRefOrGetter,type MaybeRef, computed, shallowReactive} from 'vue'
import type {SelectProps,SelectValue,SelectOption} from 'tdesign-vue-next'
import { debounce } from 'lodash-es'

export type UseSelectProps={

 serverFilter?:boolean // 是否在服务器端进行过滤
 pagination?:boolean // 是否分页
 debounce?:number // 节流时间，默认500ms
 request?:(params:{keyword:string,currentPage:number,pageSize:number})=>Promise<{success:boolean,records:SelectOption[],total:number}>
 /** 是否在组件挂载时自动请求 */
 manualRequest?: boolean
 // immediate?: boolean
}&Partial<SelectProps>

export type UseSelectInstance={

}
export const useSelect = (props:MaybeRefOrGetter<UseSelectProps>) => {
    const finalProps=computed<UseSelectProps>(()=>({
        debounce:500,
        serverFilter:false,
        pagination:false,
        manualRequest:false,
        keys:{
            label:'label',
            value:'value'
        },
        ...toValue(props)
    }))
    const options=shallowRef<SelectOption[]>([])
    const searchKeyword=shallowRef('')
    const loading=shallowRef(false)
    const paginationInfo=shallowReactive({
        currentPage:1,
        pageSize:10,
        total:0
    })
    const getOptionLabel=(option:SelectOption)=>{
        return option[finalProps.value.keys.label as keyof SelectOption]
    }
    const getOptionValue=(option:SelectOption)=>{
        return option[finalProps.value.keys.value as keyof SelectOption]
    }
    const fetchOptions=async ()=>{         
            try{
                const params={
                    keyword:searchKeyword.value,
                    currentPage:paginationInfo.currentPage,
                    pageSize:paginationInfo.pageSize
                }
                loading.value=true
                const res=await finalProps.value.request(params)
                if(res.success){
                    options.value=res.records
                    paginationInfo.total=res.total
                }else{
                    options.value=[]
                    paginationInfo.total=0
                }
            }catch(error){
            }finally{
                loading.value=false
            }
    }
    const debounceFetchOptions=debounce(fetchOptions,finalProps.value.debounce)
    const handleSearch=async (keyword:string)=>{
        searchKeyword.value=keyword
        debounceFetchOptions()
    }

    const handleFilter:SelectProps['filter']=(keyword,option)=>{
        return getOptionLabel(option).includes(keyword)||String(getOptionValue(option)).includes(keyword)
    }
    const selectProps=computed(()=>{
        const {serverFilter,pagination,manualRequest,request,...restProps}=finalProps.value
        return {
            filterable:true,
            filter:handleFilter,
            ...(request?{
                options:options.value
            }:{}),
            ...(serverFilter?{
                onSearch:handleSearch
            }:{}),
            ...restProps
        }
    })
    const instance={
        options
    }
    return [selectProps,instance] as const
}