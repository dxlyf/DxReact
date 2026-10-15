import type {Component,ComputedRef,ConcreteComponent} from 'vue'
export type FieldType='array'|'object'|'atom'
export type FieldPath=(string|number)[]
export type FieldScheme={
    type:FieldType
    key?:string
    label?:string
    props?:any
    defaultValue?:any // 默认值
    isRoot?:boolean // 是否是根字段，默认 false
    visible?:boolean // 是否可见，默认 true
    builtin?:boolean // 是否内置组件，默认 false
    formatItemLabel?:(item:any,index:number,scheme:FieldScheme)=>string
    formatLabel?:(label:string,scheme:FieldScheme)=>string
}
export type ArrayFieldScheme = FieldScheme & {
    type: 'array'
    valueType?:'array<object>'|'array<string>' // 不需要指定，根据scheme自动判断
    sortable?:boolean // 默认 false
    allowAdded?:boolean // 默认 true ，是否允许添加子项
    allowAddedField?:boolean // 默认 true ，是否允许为子项添加字段
    schemes: AllFieldScheme[] // 如果valueType array<string>',只能有一个scheme
}
export type ObjectFieldScheme = FieldScheme & {
    type: 'object'
    allowAddedField?:boolean // 默认 true ，是否允许为子项添加字段
    schemes: AllFieldScheme[]
}
export type AtomFieldScheme = FieldScheme & {
    type: 'atom'
    wrapper?:boolean // 是否需要包裹，默认，默认 true
    component:string|Component
}

export type AllFieldScheme=ArrayFieldScheme|ObjectFieldScheme|AtomFieldScheme


export type FormScheme=AllFieldScheme

