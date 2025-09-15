import {BetaSchemaForm} from '@ant-design/pro-components'
import type {ProFormColumnsType} from '@ant-design/pro-components'
import { useMemoizedFn } from 'ahooks'
import {Form} from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
type BetaSchemaFormProps=Parameters<typeof BetaSchemaForm>[0]
type UseSchemaFormProps={
    defaultFilterParams?:any
    ready?:boolean // 是否准备好
}&BetaSchemaFormProps
export type {
    ProFormColumnsType as SearchFormColumn
}

export const useSchemaFormColumns=(factory:()=>ProFormColumnsType<unknown,unknown>[],deps:readonly unknown[])=>{
    return useMemo(factory,deps)
}
export const useSchemaForm=(props:UseSchemaFormProps)=>{
    const {ready,onFinish,onReset,form:propForm,defaultFilterParams={},...restProps}=props
    const [form]=Form.useForm(propForm)
    const [formFieldValues,setFormFieldValues]=useState(()=>defaultFilterParams)
    const innerRef=useRef({readyInit:false})
    const handleFinish=useMemoizedFn(async (values:any)=>{
        setFormFieldValues({...values})
        onFinish?.(values)
    })
    const handleReset=useMemoizedFn(async (values:any)=>{
        setFormFieldValues({...values})
        onReset?.(values)
    })
    const searchFormProps:BetaSchemaFormProps={
        onFinish:handleFinish,
        onReset:handleReset,
        ...restProps,
        form
    }
    useEffect(()=>{
        if(!innerRef.current.readyInit&&ready===undefined||ready){
           innerRef.current.readyInit=true
           setTimeout(() => {
            const values=form.getFieldsValue() as any
             setFormFieldValues({...values})
           },50);
        }
    },[ready])
    return {
        form,
        formFieldValues,
        searchFormProps
    }
}
export const SchemaForm=(props:BetaSchemaFormProps)=>{

    return <BetaSchemaForm layoutType='QueryFilter' {...(props as any)}></BetaSchemaForm>
}