import {Input,Select,Cascader,Transfer,InputNumber,DatePicker,Upload,UploadFile,Checkbox,Radio,AutoComplete,} from 'antd'
import type {GetRef,GetProps,GetProp} from 'antd'
import React, { useCallback } from 'react';


const components={
    text:Input,
    select:Select,
    number:InputNumber,
    datePicker:DatePicker,
    upload:Upload,
    checkbox:Checkbox,
    autoComplete:AutoComplete,
    cascader:Cascader,
    transfer:Transfer
} as const;
type ComponentTypes=typeof components

type ComponentMapProps={
    [K in keyof ComponentTypes]:GetProps<ComponentTypes[K]>
}

const useFormFieldControl=()=>{
    const getComponent=useCallback((name:keyof ComponentMapProps)=>{
          return components[name] as React.ComponentType<ComponentMapProps[keyof ComponentMapProps]>
    },[])
    const Select=getComponent('select')
    return <Select options={}  ></Select>
    return {
        getComponent
    }
}

export {
    useFormFieldControl
}