import {Image,Modal,Upload} from 'antd'
import type {GetProps} from 'antd'
import type React from 'react'
import {} from 'antd'
import { useMemoizedFn } from 'ahooks'
type UploadProps=GetProps<typeof Upload>
type ProUploadProps=UploadProps&{

}
const ProUpload=(props:React.PropsWithChildren<ProUploadProps>)=>{
    const {onPreview,...restProps}=props

    const handlePreview=useMemoizedFn(()=>{

    })
    return <Upload onPreview={handlePreview} {...restProps}></Upload>
}