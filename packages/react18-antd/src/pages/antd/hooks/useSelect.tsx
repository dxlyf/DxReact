import {Select} from 'antd'
import type {SelectProps,GetProp} from 'antd'
import { useCallback } from 'react'
import useRequest,{type UseRequestOptions} from 'src/hooks/useRequest'
export type UseSelectProps=SelectProps&{
    requestOptions?:UseRequestOptions<any>
    serverFilter?:boolean
}
const useSelect=(props:UseSelectProps)=>{
    const {requestOptions={},serverFilter=false,...restSelectProps}=props

    const {data,loading,setLoading,setData,read}=useRequest<GetProp<typeof Select,'options'>>({
        defaultData:[],
        data:props.options,
        debounceWaitTime:1000,
        ...requestOptions
    })
    const handleSearch=useCallback((value:string)=>{
          read({keyword:value})
    },[])
    const selectProps:SelectProps={
        allowClear:true,
        loading,
        options:data,
        showSearch:true,
        ...(serverFilter?{
            onSearch:handleSearch,
            filterOption:false
        }:{
            filterOption:true
        }),
        ...restSelectProps
    }
    const ret=[selectProps,{
        data,
        loading,
        setLoading,
        read,
        setData
    }]
    return ret as typeof ret
}
export default useSelect