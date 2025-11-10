import {Form,Input,Select,InputNumber,DatePicker, Row, Col} from 'antd'
import type {FormItemProps,ColProps,GetProp,GetProps,GetRef, FormInstance} from 'antd'
import  React, { useCallback } from 'react'



type ValueOrFuncType<T,P=any>=((...args:P extends Array<any>?P:[P])=>T)
type UseFormItem<T=any,V extends string=ValueType>={
    valueType?:V
    label?:React.ReactNode
    name?:string|string[]
    colProps:ValueOrFuncType<ColProps>
    formItemProps?:ValueOrFuncType<FormItemProps>
    fieldProps?:ValueOrFuncType<T>
    render?:(form:FormInstance,dom:React.ReactNode)=>React.ReactNode
}
type UseFromRenderProps<T,V extends string>={
    wrapFromItem?:boolean
    initialValues?:T
    gutter?:[number,number]|number
    items:UseFormItem<T,V>[]
}
const FormComponents={
    text:Input,
    select:Select,
    number:InputNumber,
    datePicker:DatePicker,
} as const
type ValueType=keyof typeof FormComponents

const getValueOrValueFunc=(value:any,defaultValue:any,...args:any[])=>{
    if(value==null) return defaultValue
    return typeof value==='function'?value(...args):value
}
const useFormRender=<T=any,V extends string='text'>(props:UseFromRenderProps<T,V>)=>{
    const {items,gutter,wrapFromItem=false}=props
    const [form]=Form.useForm()
    const renderItem=useCallback((item:UseFormItem<T>)=>{
        const {valueType,name,label,render,formItemProps,fieldProps}=item
        const FormComponent=FormComponents[valueType] as React.ComponentType
        const newFieldProps={
            ...getValueOrValueFunc(fieldProps,{},form,item)
        }
         const newFormItemProps={
            name,
            label,
            ...getValueOrValueFunc(formItemProps,{},form,item)
        }
        const fieldDom=<FormComponent {...newFieldProps}></FormComponent>
        let dom:React.ReactNode=fieldDom;
        if(wrapFromItem){
            dom= <Form.Item {...newFormItemProps}>{fieldDom}</Form.Item>
        }
        return render?render(form,dom):dom;
    },[wrapFromItem])
    const renderItems=useCallback((items:UseFormItem[])=>{
        return <Row gutter={gutter}>{items.map(item=>{
               const {colProps}=item
            const newColprops={
                ...getValueOrValueFunc(colProps,{},form)
            }
               return <Col {...newColprops}></Col>
        })}</Row>
    },[items,renderItem,gutter])

    return [] as const
}