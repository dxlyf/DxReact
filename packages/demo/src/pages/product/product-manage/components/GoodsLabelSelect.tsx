import React, { useCallback, useEffect, useState,forwardRef,useImperativeHandle } from 'react'
import {Select} from 'antd'
import {getLabelConfig} from '@/services/setting'

const {Option}=Select
const GoodsLabelSelect:React.FC<any>=forwardRef((props,ref)=>{
    let {children,...restProps}=props
    let [options,setOptions]=useState<any>([])
    useEffect(()=>{
        getLabelConfig().then((options:any)=>{
                setOptions(options)
        })
    },[])
    useImperativeHandle(ref,()=>({}),[])
    return <Select {...restProps}>
        <Option value="0" key="0">无</Option>
        {options.map(item=><Option value={item.id} key={item.id}>{item.label}</Option>)}
    </Select>
})

export default GoodsLabelSelect