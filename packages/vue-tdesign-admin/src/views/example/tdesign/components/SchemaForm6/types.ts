import type {Component,ComputedRef,ConcreteComponent} from 'vue'
export type FieldType='array'|'object'|'atom'
export type FieldPath=(string|number)[]
export type FieldSchema={
    type:FieldType
    key?:string
    label?:string
    props?:any
    defaultValue?:any // 默认值
    visible?:boolean // 是否可见，默认 true
    formatItemLabel?:(item:any,index:number,Schema:FieldSchema)=>string
    formatLabel?:(label:string,index:number|null,Schema:FieldSchema)=>string
}
export type ArrayFieldSchema = FieldSchema & {
    type: 'array'
    valueType?:'array<object>'|'array<string>' // 不需要指定，根据Schema自动判断
    sortable?:boolean // 默认 false
    allowAdded?:boolean // 默认 true ，是否允许添加子项
    allowAddedField?:boolean // 默认 true ，是否允许为子项添加字段
    schemas: AllFieldSchema[] // 如果valueType array<string>',只能有一个Schema
}
export type ObjectFieldSchema = FieldSchema & {
    type: 'object'
    allowAddedField?:boolean // 默认 true ，是否允许为子项添加字段
    schemas: AllFieldSchema[]
}
export type AtomFieldSchema = FieldSchema & {
    type: 'atom'
    wrapper?:'field'|'card'|'none' // 是否需要包裹，默认，默认 true
    component:string|Component
}

export type ObjectVisibleField={
    visible:boolean // 是否显示
    key:string // 字段Key 
    builtin:boolean // 是否内置字段
    schema:AllFieldSchema // 字段Schema
}
export type ObjectFieldState={
    fields:ObjectVisibleField[]
}
export type AllFieldSchema=ArrayFieldSchema|ObjectFieldSchema|AtomFieldSchema


export type FormSchema=ArrayFieldSchema|ObjectFieldSchema

