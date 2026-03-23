import type { MaybeRefOrGetter } from "vue"
import { computed, reactive, shallowReactive, toValue } from "vue"

const FieldTypes={
    TEXT:'text',
    NUMBER:'number',
    DATE_RANGE:'date_range',
    BOOLEAN:'boolean',
} as const

type FieldValueType={
    [FieldTypes.TEXT]:string
    [FieldTypes.NUMBER]:number
    [FieldTypes.DATE_RANGE]:(string|number|Date)[]
    [FieldTypes.BOOLEAN]:boolean
}
export type SearchFormFieldType=typeof FieldTypes[keyof typeof FieldTypes]
export type SearchFormField<T extends SearchFormFieldType='text'>={
    type:T
    defaultValue?:FieldValueType[T]|(()=>FieldValueType[T])
    isValid?:(value:FieldValueType[T]|null|undefined)=>boolean
    transform?:(value:FieldValueType[T])=>FieldValueType[T]
    normalize?:(value:string)=>FieldValueType[T]
}
const defaultFieldConfig:Record<SearchFormFieldType,SearchFormField<SearchFormFieldType>>={
    [FieldTypes.TEXT]:{
        type:FieldTypes.TEXT,
        defaultValue:'',
        transform:(value)=>value,
        normalize:(value)=>value,
    },
    [FieldTypes.NUMBER]:{
        type:FieldTypes.NUMBER,
        transform:(value)=>value,
        normalize:(value)=>Number(value),
    },
    [FieldTypes.DATE_RANGE]:{
        type:FieldTypes.DATE_RANGE,
        defaultValue:()=>[],
        transform:(value)=>value,
        normalize:(value)=>value.split(','),
    },
    [FieldTypes.BOOLEAN]:{
        type:FieldTypes.BOOLEAN,
        defaultValue:false,
        transform:(value)=>value,
        normalize:(value)=>Boolean(value),
    },
} as const
const createField=(value:SearchFormField|any)=>{
    if(isObject(value)){
        return {
            ...defaultFieldConfig[(value as SearchFormField).type||FieldTypes.TEXT],
            ...value,
        }
    }
    let type:SearchFormFieldType=FieldTypes.TEXT
    switch(Object.prototype.toString.call(value)){
        case '[object String]':
          type=FieldTypes.TEXT
          break
        case '[object Number]':
          type=FieldTypes.NUMBER
          break
        case '[object Array]':
          type=FieldTypes.DATE_RANGE
          break 
        case '[object Boolean]':
          type=FieldTypes.BOOLEAN
          break
        default:
          type=FieldTypes.TEXT
          break
    }
    return {
        ...defaultFieldConfig[type],
        defaultValue:value,
    }
    
}


/**
 * 统一搜索表单基本配置和便捷开发
 */
export type SearchFormInstance = {
    search: () => void,
    reset: () => void,
    searchParams: () => Record<string, any>,
}

export type UseSearchFormProps<T> = {
    syncParamsToUrl?: boolean,// 是否同步参数到URL
    filterEmpty?: boolean,// 是否过滤空值
    filterNullOrUndefined?: boolean,// 是否过滤null和undefined值
    defaultParams?:T,// 默认数据值
    transform?:(params:Record<string,any>,name:string,value:any)=>any,// 自定义参数值转换
    normalize?:(name:string,value:any)=>any,// 自定义参数值转换
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
export const useSearchForm = <T extends Record<string, any>=any>(_props: MaybeRefOrGetter<UseSearchFormProps<T>>) => {
    const props = computed(() => ({
        defaultParams: {} as T,
        filterEmpty: true,
        filterNullOrUndefined: true,
        syncParamsToUrl: true,
        ...toValue(_props),
    }))
    // 搜索表单数据
    const searchForm = shallowReactive<T>(cloneDeep({},props.value.defaultParams))

    const isSkipValue=(value:any):boolean=>{
        if(isArray(value)){
            return value.every((item)=>isSkipValue(item))
        }
        return props.value.filterEmpty && value === '' || props.value.filterNullOrUndefined && (value === null || value === undefined)
    }
    // 搜索参数
    const searchParams=computed(()=>{
        let params:Record<string,any>={}
        for(const [key,value] of Object.entries(searchForm)){
            const finalValue=props.value.transform?props.value.transform(params,key,value):value
             if(isSkipValue(finalValue)){
                continue
            }
            params[key]=finalValue
        }
        return params
    })
    // 同步参数到URL
    const pushParamsToUrl=()=>{
        if(!props.value.syncParamsToUrl){
            return
        }
        const urlInfo = new URL(window.location.href,window.location.origin)
        for(const [key] of Object.entries(searchForm)){
            let value=searchParams.value[key]
            if(isSkipValue(value)){
                urlInfo.searchParams.delete(key)
            }else{
                urlInfo.searchParams.set(key,value as any)
            }
        }
        window.history.pushState({}, '', urlInfo.toString())
    }
    const pullParamsFromUrl=()=>{
        if(!props.value.syncParamsToUrl){
            return
        }
        const urlInfo = new URL(window.location.href,window.location.origin)
        for(const [key,value] of urlInfo.searchParams.entries()){
            const finalValue=props.value.normalize?props.value.normalize(key,value):value
            if(isSkipValue(finalValue)){
                continue
            }
            if(Array.isArray(props.value.defaultParams[key])&&typeof finalValue==='string'){
                searchForm[key as keyof T]=finalValue.split(',') as any
            }else{
                searchForm[key as keyof T]=finalValue
            }
        }
    }
    // 从URL中获取参数
    pullParamsFromUrl()
    // 重置搜索表单
    const reset = () => {
        for(const [key,value] of Object.entries(props.value.defaultParams)){
            searchForm[key as keyof T] =value
        }
        props.value.onReset?.(searchParams.value)
        pushParamsToUrl()
    }
    // 搜索
    const search = () => {
        props.value.onSearch?.(searchParams.value)
        pushParamsToUrl()
    }
    return [searchForm,{
        search,
        reset,
        searchParams
    }] as const
   }

