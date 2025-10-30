import {Select} from 'antd'
import type {SelectProps,GetProp} from 'antd'
import { useCallback } from 'react'
import useRequest,{type UseRequestOptions} from 'src/hooks/useRequest'
import useControllerValue from './useControllerValue'
export type UseSelectProps=SelectProps&{
    requestOptions?:UseRequestOptions<any>
    serverFilter?:boolean
}

const useSelect=(props:UseSelectProps)=>{
    const {requestOptions={},serverFilter=false,onChange,...restSelectProps}=props

    const [value,setValue]=useControllerValue({
        value:props.value,
        defaultValue:props.defaultValue,
        onChange:onChange
    })
    const {onChange:onRequestChange,...restRequestOptions}=requestOptions
    const {data:options,loading,setLoading,setData,read}=useRequest<GetProp<typeof Select,'options'>>({
        defaultData:[],
        data:props.options,
        debounceWaitTime:500,
        onChange:(data,flag)=>{
            if(flag===useRequest.FLAGS.DEP_REQUEST&&!data||!data.some(d=>d.value==value)){
                setValue(undefined)
            }
            onRequestChange?.(data,flag)
        },
        ...restRequestOptions
    })
    const handleSearch=useCallback((value:string)=>{
          read({keyword:value})
    },[])
    const selectProps:SelectProps={
        value:value,
        allowClear:true,
        loading,
        options,
        showSearch:true,
        onChange:setValue,
        ...(serverFilter?{
            onSearch:handleSearch,
            filterOption:false
        }:{
            filterOption:true
        }),
        ...restSelectProps
    }
    const ret=[selectProps,{
        options,
        loading,
        setLoading,
        read,
        setData
    }]
    return ret as typeof ret
}
export default useSelect