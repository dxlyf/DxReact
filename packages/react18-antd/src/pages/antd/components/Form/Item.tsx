import {Form,Input,Select,InputNumber,Checkbox,DatePicker,Cascader} from 'antd'
import type {GetProps,GetProp,GetRef} from 'antd'
import React, {createContext, useContext, useMemo} from 'react'
const {Item,useForm,useWatch,useFormInstance}=Form
type FormItemProps=GetProps<typeof Item>



type ProFormFieldProps<P>={
    valueType:string
    children?:React.ReactNode
    render?:(defaultDom?:React.ReactNode)=>React.ReactNode
}&P
//type FieldComponentProps<T extends React.ComponentType<any>>=T extends React.ComponentType<infer P>?P:never
//type Props=FieldComponentProps<typeof PPP>

type ProFormItemFieldProps<P=any>=FormItemProps&{
    component?:React.ComponentType
    hideLabel?:boolean
    valueType:string
    fieldProps:P
}
type FormFieldConfigItem={
    component:React.Component
    
}
const defaultFormFieldMap={
    text:Input,
    number:InputNumber,
    checkbox:Checkbox,
    date:DatePicker,
    dateRange:DatePicker.RangePicker
} as const


type FormFieldMapType=typeof defaultFormFieldMap
type FormFieldMapValueTypes=keyof FormFieldMapType
// type FormFieldMapTypes={}
// interface IFormFieldMap{

// }


const FormFieldMapContext=createContext<Record<string,React.ComponentType<any>>>(defaultFormFieldMap)
const ProFormField=<P=any>(props:ProFormFieldProps<P>)=>{
    const {valueType:propValueType,render,...restProps}=props
    const fieldMap=useContext(FormFieldMapContext)
    const valueType=useMemo(()=>propValueType||'text',[propValueType])
    const FieldComponent=useMemo(()=>fieldMap[valueType],[fieldMap,valueType])

    const defaultFieldDom=<FieldComponent {...restProps}></FieldComponent>
    const renderDom=()=>{
        if(render){
            return render(defaultFieldDom)
        }
        return defaultFieldDom
    }
    return renderDom()
}

const ProFormItemField=(props:ProFormItemFieldProps)=>{
    const {label,hideLabel=false,component:FormItem=Form.Item,valueType:propValueType,fieldProps={},...restProps}=props
    const {placeholder,...restFieldProps}=fieldProps
    const fieldMap=useContext(FormFieldMapContext)
    const valueType=useMemo(()=>propValueType||'text',[propValueType])
    const FieldComponent=useMemo(()=>fieldMap[valueType],[fieldMap,valueType])

    const labelPrefix=''
    const mergePlaceholder=useMemo(()=>{
       if(placeholder!==undefined){
        return placeholder
       }
       if(label!==undefined){
          
       }
    },[valueType,label,placeholder])
    const finalFieldProps={
        placeholder:mergePlaceholder,
        ...restFieldProps
    }
    const finalFormItemProps:FormItemProps={
        ...(!hideLabel?{
            label
        }:{}),
        ...restProps
    }
    return <FormItem {...finalFormItemProps}>
        <FieldComponent {...finalFieldProps}></FieldComponent>
    </FormItem>
}
/**
 * [2,0]  [1,0]   [1,0] [0.5,0] [1,0] [0.5,0] [1,0] [0.5,0]
 * [0,4]  [0,1]   [0,4] [0,1]   [0,4] [0,1]  [0,1] [0,0.25]
 * 
*/
// d=8
// [4,0]  [0.5,0]  [0.5,0]
// [0,2]  [0,0.25] [0,0.25]
export {
    ProFormField,
    FormFieldMapContext
}