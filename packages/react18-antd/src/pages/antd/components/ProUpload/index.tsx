import {Button, Image,Modal,Upload} from 'antd'
import type {ButtonProps, GetProp, GetProps} from 'antd'
import type React from 'react'
import {} from 'antd'
import { useMemoizedFn } from 'ahooks'
import { useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react'
 import useControllableValue from 'src/hooks/useControllableValue' 
// import useUpdate from 'src/hooks/useUpdate' 

type UploadProps=GetProps<typeof Upload>
type ProUploadProps=UploadProps&{
    visibleUploadBtn?:boolean
    uploadText?:string
    uploadBtnProps?:ButtonProps
    children?:React.ReactNode|(()=>React.ReactNode)
    maxUploadCount?:number // 最大上传数
}

const ProUpload=(props:React.PropsWithChildren<ProUploadProps>)=>{
    const {disabled,onChange,defaultFileList:propDefaultFileList,fileList:propFileList,maxUploadCount=Infinity,headers,uploadBtnProps={},uploadText='上傳',children,visibleUploadBtn=true,onPreview,...restProps}=props
    
    const [fileList,setFileList]=useControllableValue<GetProp<typeof Upload,'fileList'>>(props,{
        defaultValue:[],
        valuePropName:'fileList',
        defaultValuePropName:'defaultFileList',
        strict:false
    })
    const handlePreview=useMemoizedFn<GetProp<typeof Upload,'onPreview'>>((file)=>{
            
    })
    
    const handleChange=useMemoizedFn<GetProp<typeof Upload,'onChange'>>((info)=>{
         //const {file,fileList}=info
         onChange?.(info)
    })
    const uploadBtn=useMemo(()=>{
        if(typeof children==='function'){
            return children()
        }else if(children){
            return children
        }
        return <Button disabled={disabled} {...uploadBtnProps}>{uploadText}</Button>
    },[children])
    const visible=fileList&&fileList.length>=maxUploadCount?false:visibleUploadBtn
    return <Upload headers={{
           'Content-Type': 'multipart/form-data',
           ...(headers?headers:{})
    }} action={'/api/upload'} fileList={fileList} disabled={disabled} onChange={handleChange} onPreview={handlePreview} {...restProps}>
        {visible&&uploadBtn}
    </Upload>
}
export {
    ProUpload
}