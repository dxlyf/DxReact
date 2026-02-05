import type {FormItemProps,FormProps} from 'tdesign-vue-next'
import {Input,InputNumber,Select,DatePicker} from 'tdesign-vue-next'
import {type FormFieldProps} from './form-field.ts'

export type SearchFormColumnType={
    key?:string,
    span?:number,
    hidden?:boolean,
    order?:number,
}&FormFieldProps
export type RowColType={
    key?:string,
    span?:number,
    hidden?:boolean,
    order?:number,
    props:FormFieldProps,
}
export type SearchFormProps={
    alwaysExpand?:boolean,
    defaultColumnSpan?:number,
    maxColumnSpan?:number,
    maxShowRows?:number,
    columns?:SearchFormColumnType[]
}&FormProps
export type {
    FormProps
}