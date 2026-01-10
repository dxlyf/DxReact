import {Select,Spin} from 'antd'
import type {SelectProps,GetProp} from 'antd'
import React, { useCallback, useMemo,useRef } from 'react'
import useRequest,{type UseRequestOptions} from 'src/hooks/useRequest'
import useControllerValue from './useControllerValue'
export type UseSelectProps=SelectProps&{
    requestOptions?:UseRequestOptions<any>
    serverFilter?:boolean
    defaultSelectedIndex?:number
    label?:React.ReactNode
    unmatchShow?:boolean // 未匹配到value时显示optionLabel
}

const useSelect=(props:UseSelectProps)=>{
    const {defaultSelectedIndex,label,value:propValue,unmatchShow,requestOptions={},serverFilter=false,onChange,...restSelectProps}=props

    const [value,setValue]=useControllerValue({
        value:propValue,
        defaultValue:props.defaultValue,
        onChange:onChange
    })
 
    const {onChange:onRequestChange,...restRequestOptions}=requestOptions
     const fetchRef = useRef(0);
    const {data:options,loading,setLoading,setData,read}=useRequest<GetProp<typeof Select,'options'>>({
        defaultData:[],
        data:props.options,
        debounceWaitTime:500,
        onRequestStart:()=>{
            setData([])
        },
        onChange:(data,flag)=>{

            if(flag===useRequest.FLAGS.DEP_REQUEST&&(!data||!data.some(d=>d.value==value))){
                setValue(undefined)
            }else if(flag===useRequest.FLAGS.INIT_REQUEST&&defaultSelectedIndex!==undefined&&data&&data.length){
                setValue(data[defaultSelectedIndex].value)
            }
            onRequestChange?.(data,flag)
        },
        ...restRequestOptions
    })
    const handleSearch=useCallback((value:string)=>{
        
          read({keyword:value})
    },[])
    const isMatchValue=useMemo(()=>{
        if(!unmatchShow){
             return true
        }
        if(value===undefined||!options||options.length<=0){
             return false
        }
        return options.some(o=>String(o.value)===String(value))
    },[value,options,unmatchShow])
    const selectProps:SelectProps={
        value:isMatchValue?value:label,
        allowClear:true,
        loading,
        options,
        showSearch:true,
        onChange:setValue,
        notFoundContent:loading ? <Spin size="small" /> : 'No results found',
        ...(serverFilter?{
            onSearch:handleSearch,
            filterOption:false
        }:{
            filterOption:true
        }),
        ...restSelectProps
    }
    return [selectProps,{
        isMatchValue,
        options,
        loading,
        setLoading,
        read,
        setData
    }] as const
}
export default useSelect