import { useMemoizedFn } from 'ahooks'
import {Select} from 'antd'
import type {SelectProps,GetProp,GetProps,GetRef} from 'antd'
import { useCallback, useState } from 'react'

type ProSelectProps=SelectProps&{
    request?:(searchKey:string)=>Promise<Required<SelectProps['options']>>
}
const ProSelect=(props:ProSelectProps)=>{
    const {request:propRequest,options:propOptions,onChange,optionLabelProp='label',...restProps}=props
    const [keyword,setKeyword]=useState('')
    const [innerOptions,setInnerOptions]=useState(()=>[])
    const isControlled=propOptions!==undefined
    const options=isControlled?propOptions:innerOptions
    const request=useMemoizedFn(async (keyword:string)=>{
        const data=await propRequest?.(keyword)
        
    })
    const handleSearch=useCallback<Extract<SelectProps['onSearch'],Function>>((nextKeyword)=>{
        if(keyword!==nextKeyword){
            setKeyword(keyword)
        }
    },[keyword])
    const handleFilter=useCallback<Extract<SelectProps['filterOption'],Function>>((inputValue,option)=>{
        return option![optionLabelProp].includes(inputValue)
    },[])
     const handleChange=useCallback<Extract<SelectProps['onChange'],Function>>((value,option)=>{
       
    },[])
    const selectProps:SelectProps={
        allowClear:true,
        onSearch:handleSearch,
        filterOption:handleFilter,
        onChange:handleChange,
        options,
        ...restProps
    }
    return <Select {...selectProps}></Select>
}

export default ProSelect