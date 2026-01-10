import {BetaSchemaForm, ProForm} from '@ant-design/pro-components'
import type {ProFormColumnsType,ProColumns,ActionType,ProFormProps,ProFormInstance} from '@ant-design/pro-components'
import { useMemoizedFn } from 'ahooks'
import {Button, Form, Row, Space} from 'antd'
import type {FormInstance} from 'antd'
import classNames from 'classnames'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import styles from './index.module.scss'
type BetaSchemaFormProps=Parameters<typeof BetaSchemaForm>[0]
type SchemaFormProps=BetaSchemaFormProps&{
formRender?:(dom:React.ReactNode)=>React.ReactNode
}
type UseSchemaFormProps={
    useProFormInstanceOptions?:UseProFormInstanceOptions
    manualRequest?:boolean
    delayInitRequest?:number
    actionRef?:React.RefObject<ActionType>
    defaultFilterParams?:any
    delayInitTime?:number
    columns?:ProColumns[],
    expandable?:boolean
}&Omit<BetaSchemaFormProps,'columns'>
export type {
    ProColumns as SearchFormColumn
}

 const useSchemaFormColumns=(factory:()=>ProColumns[],deps:readonly unknown[])=>{
    return useMemo(factory,deps)
 }
 type UseProFormInstanceOptions={
    transformFieldValue?(name:Parameters<FormInstance['getFieldValue']>[0],value:any):any
    transformFieldsValue?(values:any):any
 }
 const useProFormInstance=(propForm?:FormInstance<unknown>,options:UseProFormInstanceOptions={})=>{
    const [form]=Form.useForm(propForm)
    const latest=useRef<UseProFormInstanceOptions>(options)
    latest.current=options
    const [instance]=useState(()=>{
        return {
            ...form,
            getFieldValue:(name:Parameters<FormInstance['getFieldValue']>[0])=>{
                const value=form.getFieldValue(name)
                if(latest.current.transformFieldValue){
                    return latest.current.transformFieldValue(name,value)
                } 
                return value
            },
            getFieldsValue:(...args:Parameters<FormInstance['getFieldValue']>)=>{
                const values=form.getFieldsValue(...args)
                if(latest.current.transformFieldsValue){
                    return latest.current.transformFieldsValue(values)
                } 
                return values
            }
        } as FormInstance
    })
    return [instance]
 }
 const useSchemaForm=(props:UseSchemaFormProps)=>{
    const {expandable=true,delayInitTime=50,actionRef,onFinish,onReset,formRef:propFormRef,onInit,useProFormInstanceOptions,delayInitRequest=100,request:propRequest,manualRequest=false,form:propForm,defaultFilterParams={},...restProps}=props
    const __formRef=useRef<ProFormInstance>(null)
    const formRef=((propFormRef as any)??__formRef) as React.MutableRefObject<ProFormInstance>
    const [form]=useProFormInstance(propForm,useProFormInstanceOptions)
    const [formFieldValues,setFormFieldValues]=useState(()=>defaultFilterParams)
    const [effectInit,setEffectInit]=useState({init:false,values:{}})
    const handleFinish=useMemoizedFn(async (values:any)=>{
            //    const values2=formRef.current.getFieldsFormatValue!();
        setFormFieldValues({...values})
        onFinish?.(values)
        
        actionRef?.current?.reloadAndRest()
    })
    const handleReset=useMemoizedFn(async (values:any)=>{
       // const values=formRef.current.getFieldsFormatValue!();
        setFormFieldValues({...values})
        onReset?.(values)
        actionRef?.current?.reloadAndRest()

    })
    const handleInit=useMemoizedFn((values,form)=>{
        onInit?.(values,form)
        if(!manualRequest){
          setTimeout(()=>{
            console.log('handleInit')
            handleFinish(values)
          },delayInitTime)
            //setEffectInit({init:true,values:values})
        }
    })
    const handleInitRequest=useMemoizedFn(async (params,props)=>{
        console.log('initRequest',params,props)
        const values= await Promise.resolve().then(()=>propRequest?propRequest(params,props):{})
         return new Promise((resolve,reject)=>{
            setTimeout(()=>{
                resolve(values)
            },delayInitRequest)
         })
    })
    useEffect(()=>{
        if(effectInit.init){
            console.log('初始化')
            handleFinish(effectInit.values)
        }
    },[effectInit])
    const searchFormProps:SchemaFormProps={
        //  formRender:(dom)=>{
        //     if(expandable){
        //         return dom
        //     }
        //     return <Space>
        //         {dom}
        //         <Button type='primary' onClick={()=>{
        //         form?.submit()
        //     }}>查询</Button>
        //        <Button  onClick={()=>{
        //         formRef.current.resetFields()
        //         handleReset(formRef.current.getFieldFormatValue())
        //     }}>重置</Button>
        //     </Space>
        // },
        ...(expandable?{
            submitter:{
                render(props,dom){
                    return dom.reverse()
                },
                searchConfig:{
                    submitText:'查询'
                }
            },
            style:{
                width:'100%',

            },
            submitterColSpanProps:{
               flex:'none',
                className:styles.proFormSearchExpandBtn
            },
            defaultColsNumber:3,
            span:4,         
            layoutType:'QueryFilter',
            layout:'inline',
            className:classNames('ah-search-form',styles.proFormSearchExpand),
        }:{
            layoutType:'Form',
            submitter:false,
            wrapperCol:{flex:200},
            className:classNames('ah-search-form',styles.proFormSearch),
        }),
        labelWidth:0,
        onFinish:handleFinish,
        onReset:handleReset,
        onInit:handleInit,
        //columns,
        ...restProps,
        form,
        formRef
    }

    return {
        formRef,
        form,
        formFieldValues,
        searchFormProps
    }
}
 const SchemaForm=(props:SchemaFormProps)=>{
    const {formRender,className,...restProps}=props
    const dom=<BetaSchemaForm  className={classNames(className)} {...restProps}></BetaSchemaForm>
    return formRender?formRender(dom):dom
     
}
export {
    SchemaForm,
    useSchemaForm,
    useSchemaFormColumns
}