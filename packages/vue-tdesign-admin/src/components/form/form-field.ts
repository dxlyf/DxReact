import type {FormItemProps} from 'tdesign-vue-next'
import {Input,InputNumber,Select,DatePicker,TimePicker,DateRangePicker,TimeRangePicker,Cascader} from  'tdesign-vue-next'
import type { Component} from 'vue'
export type GetVueComp<T> = T extends Component<infer P> ? P : never
export type GetProps<T>=GetVueComp<T> extends {$props: infer P} ? P : never
export const FormFieldTypes={
    Text:'text',
    InputNumber:'number',
    Select:'select',
    DatePicker:'date-picker',   
    TimePicker:'time-picker',
    DateRangePicker:'date-range-picker',
    TimeRangePicker:'time-range-picker',
    Cascader:'cascader',
} as const
export const FormFeildComponents={
    [FormFieldTypes.Text]:Input,
    [FormFieldTypes.InputNumber]:InputNumber,
    [FormFieldTypes.Select]:Select,
    [FormFieldTypes.DatePicker]:DatePicker,
    [FormFieldTypes.TimePicker]:TimePicker,
    [FormFieldTypes.DateRangePicker]:DateRangePicker,
    [FormFieldTypes.TimeRangePicker]:TimeRangePicker,
    [FormFieldTypes.Cascader]:Cascader,
}
export const getPlaceeholder=(type:FieldValueType,label:string)=>{
    let prefix=''
    switch(type){
        case FormFieldTypes.Text:
        case FormFieldTypes.InputNumber:
            prefix= '请输入'
            break
        case FormFieldTypes.Select:
        case FormFieldTypes.DatePicker:
        case FormFieldTypes.TimePicker:
        case FormFieldTypes.DateRangePicker:
        case FormFieldTypes.TimeRangePicker:
        case FormFieldTypes.Cascader:
            prefix= '请选择'
            break
    }
    return `${prefix}${label}`
}
type FormFieldValueTypes={
    [K in  keyof typeof FormFieldTypes as typeof FormFieldTypes[K]]:typeof FormFieldTypes[K]
}

export type FieldValueType=keyof FormFieldValueTypes

export type FormFieldProps<T extends FieldValueType='text'>={
    type?:FieldValueType,
    name?:string,
    label?:string,
    hideLabel?:boolean,
    formItemProps?:FormItemProps|(()=>FormItemProps),
    fieldProps?:GetProps<typeof FormFeildComponents[T]>|(()=>GetProps<typeof FormFeildComponents[T]>),
}
