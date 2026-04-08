import type { MaybeRefOrGetter } from "vue"
import { computed, reactive, shallowReactive, shallowRef, toRaw, toValue,watch } from "vue"



const isArray = (value: any) => {
    return Array.isArray(value)
}
const isJsonArray=(value:any)=>{
    try{
        const jsonArray=JSON.parse(value)
        if(!isArray(jsonArray)){
            return false
        }
        return true
    }catch(err){
        return false
    }
}
const isObject = (value: any) => {
    return Object.prototype.toString.call(value) === '[object Object]'
}
const getType = (value: any) => {
    return Object.prototype.toString.call(value).slice(8, -1).toLowerCase()
}
const hasOwnProperty =(obj:any,key:string)=>{
    return Object.prototype.hasOwnProperty.call(obj,key)
}
const cloneValue = (value: any) => {
    const valueType=getType(value)
    if(valueType==='array'){
        return mergeDepth([], value)
    }
    if(valueType==='object'){
        return mergeDepth({}, value)
    }
    return value
}
const mergeDepth = (target: any, obj: any) => {
    for (const [key, value] of Object.entries(obj)) {
        if (isArray(value)) {
            target[key] = mergeDepth([], value)
        } else if (isObject(value)) {
            target[key] = mergeDepth({}, value)
        } else {
            target[key] = value
        }
    }
    return target
}
/**
 * 统一搜索表单基本配置和便捷开发
 */
export type SearchFormInstance = {
    search: () => void,
    reset: () => void,
    setFormParams: (params: Record<string, any>) => void,
    pullParams: () => void,
    pushParams: () => void,
    searchParams: () => Record<string, any>,
}

export type UseSearchFormProps<T> = {
    trim?: boolean,// 是否自动trim字符串值
    syncParamsToUrl?: boolean,// 是否同步参数到URL
    filterEmpty?: boolean,// 是否过滤空值
    filterNullOrUndefined?: boolean,// 是否过滤null和undefined值
    defaultParams?: T,// 默认数据值
    transform?: (params: Record<string, any>, name: string, value: any) => void,// 自定义参数值转换
    normalize?: (params: Record<string, any>, name: string, value: any) => void,// 自定义参数值转换
    onSearch?: (params: Record<string, any>) => void,// 搜索回调
    onReset?: (params: Record<string, any>) => void,// 重置回调
}


export const useSearchForm = <T extends Record<string, any> = any>(_props: MaybeRefOrGetter<UseSearchFormProps<T>>) => {
    const props = computed(() => ({
        defaultParams: {} as T,
        filterEmpty: true,
        filterNullOrUndefined: true,
        syncParamsToUrl: true,
        trim: true,
        ...toValue(_props),
    }))
    const defaultParams = shallowRef(cloneValue(props.value.defaultParams))
    // 搜索表单数据
    const searchForm = shallowReactive<T>(cloneValue(props.value.defaultParams))

    const isSkipValue = (value: any): boolean => {
        if (isArray(value)) {
            return value.every((item) => isSkipValue(item))
        }
        return props.value.filterEmpty && value === '' || props.value.filterNullOrUndefined && (value === null || value === undefined)
    }
    const isValidKey=(key:string)=>{
        return hasOwnProperty(defaultParams.value,key)
    }
    // 搜索参数
    const searchParams = computed(() => {
        let tmpParams: Record<string, any> = {}
        let params: Record<string, any> = {}
        for (const [key, value] of Object.entries(searchForm)) {
            tmpParams[key] = value
            if (props.value.transform) {
                props.value.transform(tmpParams, key, value)
            }
        }
        for (const [key, value] of Object.entries(tmpParams)) {
            let tmpValue = value
            const valueType = getType(tmpValue)
            if (props.value.trim && valueType === 'string') {
                tmpValue = tmpValue.trim()
            }
            if (isSkipValue(tmpValue)) {
                continue
            }
            params[key] = tmpValue
        }
        return params
    })
    // 同步参数到URL
    const pushParamsToUrl = (force:boolean=false) => {
        if (!props.value.syncParamsToUrl&&!force) {
            return
        }
        const urlInfo = new URL(window.location.href, window.location.origin)
        for (const [key] of Object.entries(searchForm)) {
            let value = searchParams.value[key]
            let valueType=getType(value)
            if (isSkipValue(value)) {
                urlInfo.searchParams.delete(key)
            } else {
                if(valueType==='array'){
                    value=value.join(',')
                }
                urlInfo.searchParams.set(key, value as any)
            }
        }
        window.history.replaceState({}, '', urlInfo.toString())
    }
    // 从URL中获取参数
    const pullParamsFromUrl = (force:boolean=false) => {
        if (!props.value.syncParamsToUrl&&!force) {
            return
        }
        const urlInfo = new URL(window.location.href, window.location.origin)
        let tmpParams: Record<string, any> = {}
        for (const [key, value] of urlInfo.searchParams.entries()) {
            // 过滤不存在的参数
            if(!isValidKey(key)){
                continue
            }
            tmpParams[key] = value
            if (props.value.normalize) {
                props.value.normalize(tmpParams, key, value)
            }
        }
        
        for (const [key, value] of Object.entries(tmpParams)) {
            let tmpValue:any =''
            // 原始类型
            const initialValueType = getType(defaultParams.value[key as keyof T])
            if(initialValueType==='array'&&typeof value==='string'){
                tmpValue=value.split(',')
            }else if(initialValueType==='number'&&Number.isFinite(Number(value))){
                tmpValue=Number(value)
            }else if(initialValueType==='boolean'&&(value==='true'||value==='false')){
                tmpValue=value==='true'
            }else {
                if(props.value.trim && typeof value === 'string') {
                    tmpValue = value.trim()
                }else{
                    tmpValue=value
                }
            } 
            if (isSkipValue(tmpValue)) {
                continue
            }
            searchForm[key as keyof T] = tmpValue
        }
    }
    // 从URL中获取参数
    pullParamsFromUrl()
    // 重置搜索表单
    const reset = () => {
        for (const [key, value] of Object.entries(defaultParams.value as T)) {
            searchForm[key as keyof T] = value
        }
        props.value.onReset?.(searchParams.value)
        pushParamsToUrl()
    }
    // 搜索
    const search = () => {
        props.value.onSearch?.(searchParams.value)
        pushParamsToUrl()
    }
    // 设置搜索参数
    const setFormParams = (params: Record<string, any>) => {
        defaultParams.value=cloneValue(params)
        for (const [key, value] of Object.entries(params)) {
            searchForm[key as keyof T] = cloneValue(value)
        }
    }
    watch(()=>toValue(_props).defaultParams,(newVal)=>{
        console.log('searchFormParams',newVal)
        if(newVal){
            setFormParams(newVal)
        }
    })
    return [searchForm, {
        search,
        reset,
        setFormParams,
        pullParams:()=>pullParamsFromUrl(true),
        pushParams:()=>pushParamsToUrl(true),
        searchParams
    }] as const
}

