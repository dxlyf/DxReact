import type {FormItemProps} from 'tdesign-vue-next'
import {Input,InputNumber,Select,DatePicker} from  'tdesign-vue-next'
import type { Component} from 'vue'
export type GetVueComp<T> = T extends Component<infer P> ? P : never
export type GetProps<T>=GetVueComp<T> extends {$props: infer P} ? P : never
export const FormFieldTypes={
    Text:'text',
    InputNumber:'number',
    Select:'select',
    DatePicker:'date-picker',   
} as const
export const FormFeildComponents={
    [FormFieldTypes.Text]:Input,
    [FormFieldTypes.InputNumber]:InputNumber,
    [FormFieldTypes.Select]:Select,
    [FormFieldTypes.DatePicker]:DatePicker,
}
type FormFieldValueTypes={
    [K in  keyof typeof FormFieldTypes as typeof FormFieldTypes[K]]:typeof FormFieldTypes[K]
}

export type FieldValueType=keyof FormFieldValueTypes

export type FormFieldProps<T extends FieldValueType='text'>={
    key?:string,
    type?:FieldValueType,
    name?:string,
    label?:string,
    formItemProps?:FormItemProps|(()=>FormItemProps),
    fieldProps?:GetProps<typeof FormFeildComponents[T]>|(()=>GetProps<typeof FormFeildComponents[T]>),
}
