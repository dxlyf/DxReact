import {BetaSchemaForm} from '@ant-design/pro-components'
import type {ProFormColumnsType,ActionType} from '@ant-design/pro-components'
import { useMemoizedFn } from 'ahooks'
import {Form} from 'antd'
import { useMemo, useState } from 'react'
type BetaSchemaFormProps=Parameters<typeof BetaSchemaForm>[0]
type UseSchemaFormProps={
    actionRef?:React.RefObject<ActionType>
    defaultFilterParams?:any
}&BetaSchemaFormProps
export type {
    ProFormColumnsType as SearchFormColumn
}

 const useSchemaFormColumns=(factory:()=>ProFormColumnsType<unknown,unknown>[],deps:readonly unknown[])=>{
    return useMemo(factory,deps)
}
 const useSchemaForm=(props:UseSchemaFormProps)=>{
    const {actionRef,onFinish,onReset,form:propForm,defaultFilterParams={},...restProps}=props
    const [form]=Form.useForm(propForm)
    const [formFieldValues,setFormFieldValues]=useState(()=>defaultFilterParams)
    const handleFinish=useMemoizedFn(async (values:any)=>{
        setFormFieldValues({...values})
        onFinish?.(values)
        actionRef?.current?.reload(true)
    })
    const handleReset=useMemoizedFn(async (values:any)=>{
        setFormFieldValues({...values})
        onReset?.(values)
        actionRef?.current?.reload(true)
    })

    const searchFormProps:BetaSchemaFormProps={
        onFinish:handleFinish,
        onReset:handleReset,
        ...restProps,
        form
    }

    return {
        form,
        formFieldValues,
        searchFormProps
    }
}
 const SchemaForm=(props:BetaSchemaFormProps)=>{

    return <BetaSchemaForm layoutType='QueryFilter' {...(props as any)}></BetaSchemaForm>
}
export {
    SchemaForm,
    useSchemaForm,
    useSchemaFormColumns
}