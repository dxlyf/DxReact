import {Input,Select,Cascader,Transfer,InputNumber,DatePicker,Upload,UploadFile,Checkbox,Radio,AutoComplete,} from 'antd'
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

const useFormFieldControl=()=>{
    const getComponent=useCallback((name:keyof ComponentTypes)=>{
          return components[name]
    },[])
    return {
        getComponent
    }
}

export {
    useFormFieldControl
}