/**
 * 模型分组
 * @author fanyonglong
 */
import React,{useEffect,memo,forwardRef, useState} from 'react'
import {Cascader} from 'antd'
import {useRequest,useControllableValue} from 'ahooks' 
import {
    getAllModelGroup
  } from '@/services/material';
import { checkAuthorize } from '@/components/Authorized';

const fieldNames = {
    value: "id",
    label: "name",
    children: "children"
}
let ModelGroup:React.FC<any>=forwardRef((props,ref)=>{
    let [options,setOptions]=useState<any>([])
    let {run}=useRequest(getAllModelGroup,{
        manual:true,
        onSuccess(data:any){
            if(!checkAuthorize(['thirdParty'])){
                setOptions(data)
            }else{
                // 第三方账号，只显示部分
                setOptions(data.filter(d=>d.id==2))
            }
        }
    })
    useEffect(()=>{
        run({pid:0})
    },[])
    return <Cascader changeOnSelect fieldNames={fieldNames} options={options} {...props}></Cascader>
})
export default memo(ModelGroup)