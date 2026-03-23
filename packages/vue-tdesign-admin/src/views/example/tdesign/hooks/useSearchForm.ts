import type { MaybeRefOrGetter } from "vue"
import { computed, reactive, shallowReactive, toValue } from "vue"

/**
 * 统一搜索表单基本配置和便捷开发
 */
export type SearchFormInstance = {
    search: () => void,
    reset: () => void,
    searchParams: () => Record<string, any>,
}

export type UseSearchFormProps = {
    syncParamsToUrl?: boolean,// 是否同步参数到URL
    filterEmpty?: boolean,// 是否过滤空值
    filterNullOrUndefined?: boolean,// 是否过滤null和undefined值
    defaultParams?: Record<string, any>,// 默认数据值
    onSearch?: (params: Record<string, any>) => void,// 搜索回调
    onReset?: (params: Record<string, any>) => void,// 重置回调
}
const isArray=(value:any)=>{
    return Array.isArray(value)
}
const isObject=(value:any)=>{
    return Object.prototype.toString.call(value) === '[object Object]'
}
const cloneDeep=(target:any,obj:any)=>{
    for(const [key,value] of Object.entries(obj)){
        if(isArray(value)){
            target[key]=cloneDeep([],value)
        }else if(isObject(value)){
            target[key]=cloneDeep({},value)
        }else{
            target[key]=value
        }
    }
    return target
}
export const useSearchForm = <T extends Record<string, any>=any>(_props: MaybeRefOrGetter<UseSearchFormProps>) => {
    const props = computed(() => ({
        defaultParams: {},
        filterEmpty: true,
        filterNullOrUndefined: true,
        syncParamsToUrl: true,
        ...toValue(_props),
    }))
    // 搜索表单数据
    const searchForm = reactive<any>(cloneDeep({},props.value.defaultParams))

    const isSkipValue=(value:any)=>{
        return props.value.filterEmpty && value === '' || props.value.filterNullOrUndefined && (value === null || value === undefined)
    }
    // 搜索参数
    const searchParams=computed(()=>{
        let params:Record<string,any>={}
        for(const [key,value] of Object.entries(searchForm)){
      
            if(isSkipValue(value)){
                continue
            }
            if(isArray(value)&&value.some((item)=>!isSkipValue(item))){
                params[key]=value
            }else{
                params[key]=value
            }
        }
        return params
    })
    // 同步参数到URL
    const pushParamsToUrl=()=>{
        if(!props.value.syncParamsToUrl){
            return
        }
        const urlInfo = new URL(window.location.href,window.location.origin)
        for(const [key,value] of Object.entries(searchParams.value)){
            urlInfo.searchParams.set(key,value as any)
        }
        window.history.pushState({}, '', urlInfo.toString())
    }
    const pullParamsFromUrl=()=>{
        if(!props.value.syncParamsToUrl){
            return
        }
        const urlInfo = new URL(window.location.href,window.location.origin)
        for(const [key,value] of urlInfo.searchParams.entries()){
            searchForm[key]=value
        }
    }
    // 从URL中获取参数
    pullParamsFromUrl()
    // 重置搜索表单
    const reset = () => {
        for(const [key,value] of Object.entries(props.value.defaultParams)){
            searchForm[key] =value
        }
        props.value.onReset?.(searchParams.value)
        pushParamsToUrl()
    }
    // 搜索
    const search = () => {
        props.value.onSearch?.(searchParams.value)
        pushParamsToUrl()
    }
    return [searchForm as T,{
        search,
        reset,
        searchParams
    }] as const
   }

