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
    transform?:(value:any)=>FieldValueType[T]
    normalize?:(value:string)=>FieldValueType[T]
}
export type FormField<T extends SearchFormFieldType='text'>={
    type:T
    defaultValue?:FieldValueType[T]
    isValid?:(value:FieldValueType[T]|null|undefined)=>boolean
    transform?:(value:any)=>FieldValueType[T]
    normalize?:(value:string)=>FieldValueType[T]
}
const defaultFieldConfig:Record<SearchFormFieldType,SearchFormField<SearchFormFieldType>>={
    [FieldTypes.TEXT]:{
        type:FieldTypes.TEXT,
        defaultValue:'',
        transform:(value:string)=>value,
        isValid:(value)=>value!==undefined&&value!==null&&value!=='',
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
        const fieldConfig=defaultFieldConfig[(value as SearchFormField).type||FieldTypes.TEXT]
        const mergeField={...fieldConfig,...value}
        const {defaultValue,...restField}=mergeField
        return {
            ...restField,
            defaultValue:typeof defaultValue==='function'?defaultValue():defaultValue
        } as FormField
    }
    let type:SearchFormFieldType=FieldTypes.TEXT
    let valueType=getType(value)
    switch(valueType){
        case 'String':
          type=FieldTypes.TEXT
          break
        case 'Number':
          type=FieldTypes.NUMBER
          break
        case 'Array':
          value=value.slice()
          type=FieldTypes.DATE_RANGE
          break 
        case 'Boolean':
          type=FieldTypes.BOOLEAN
          break
        default:
          type=FieldTypes.TEXT
          break
    }
    return {
        ...defaultFieldConfig[type],
        defaultValue:value,
    } as FormField
    
}

const isArray=(value:any)=>{
    return Array.isArray(value)
}
const isObject=(value:any)=>{
    return Object.prototype.toString.call(value) === '[object Object]'
}
const getType=(value:any)=>{
    return Object.prototype.toString.call(value).slice(8,-1)
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
    defaultParams?:T|Record<string,SearchFormField>,// 默认数据值
    transform?:(params:Record<string,any>,name:string,value:any)=>any,// 自定义参数值转换
    normalize?:(params:Record<string,any>,name:string,value:any)=>any,// 自定义参数值转换
    onSearch?: (params: Record<string, any>) => void,// 搜索回调
    onReset?: (params: Record<string, any>) => void,// 重置回调
}


export const useSearchForm = <T extends Record<string, any>=any>(_props: MaybeRefOrGetter<UseSearchFormProps<T>>) => {
    const props = computed(() => ({
        defaultParams: {} as T,
        filterEmpty: true,
        filterNullOrUndefined: true,
        syncParamsToUrl: true,
        ...toValue(_props),
    }))
    let initialSearchForm:any={}
    let fieldConfig:Record<string,FormField>={}
    const initSearchForm=(defaultParams:any)=>{
        initialSearchForm={}
        fieldConfig=Object.keys(defaultParams).reduce((acc,key)=>{
            const fieldConfig=defaultParams[key]
            const field=createField(fieldConfig)
            acc[key]=field
            initialSearchForm[key]=field.defaultValue
            return acc
        },{} as Record<string,FormField>)
    }
    initSearchForm(props.value.defaultParams)
    // 搜索表单数据
    const searchForm = shallowReactive<T>(initialSearchForm)

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
            const valueType=fieldConfig[key]
            let tmpValue=value
            if(valueType){
                tmpValue=valueType.transform(value)
            }else{
                tmpValue=value
            }
            if(props.value.transform){
                tmpValue=props.value.transform(params,key,tmpValue)
            }
             if(isSkipValue(tmpValue)){
                continue
            }
            params[key]=tmpValue
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
        window.history.replaceState({}, '', urlInfo.toString())
    }
    const defaultNormalize=(params:Record<string,any>,name:string,value:any)=>{
        const valueType=fieldConfig[name]
        if(valueType){
            params[name]=valueType.normalize(value)
        }
    }
    const pullParamsFromUrl=()=>{
        if(!props.value.syncParamsToUrl){
            return
        }
        const urlInfo = new URL(window.location.href,window.location.origin)
        let newParams:Record<string,any>={}
        for(const [key,value] of urlInfo.searchParams.entries()){
            if(!fieldConfig[key]){
                continue
            }
            if(props.value.normalize){
               props.value.normalize(newParams,key,value)
            }else{
              defaultNormalize(newParams,key,value)
            }
        }
        for(const [key,value] of Object.entries(newParams)){
             if(isSkipValue(value)){
                continue
            }
            searchForm[key as keyof T]=value
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
        pullParamsFromUrl,
        pushParamsToUrl,
        searchParams
    }] as const
   }

