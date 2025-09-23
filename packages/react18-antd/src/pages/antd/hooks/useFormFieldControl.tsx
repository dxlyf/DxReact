import {Input,Select,Cascader,Transfer,InputNumber,DatePicker,Upload,Checkbox,Radio,AutoComplete} from 'antd'
import type {GetRef as antGetRef,GetProp as antGetProp,GetProps as antGetProps} from 'antd'
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
export type ComponentTypes=typeof components

// type ComponentProps={
//     [K in keyof ComponentTypes]:GetProps<ComponentTypes[K]>
// }
type ReactRefComponent<Props extends {
    ref?: React.Ref<any> | string;
}> = (props: Props) => React.ReactNode;
type ExtractRefAttributesRef<T> = T extends React.RefAttributes<infer P> ? P : never;
export type GetRef<T extends ReactRefComponent<any> | React.Component<any>> = T extends React.Component<any> ? T : T extends React.ComponentType<infer P> ? ExtractRefAttributesRef<P> : never;
export type GetContextProps<T> = T extends React.Context<infer P> ? P : never;
export type GetContextProp<T extends React.Context<any>, PropName extends keyof GetContextProps<T>> = NonNullable<GetContextProps<T>[PropName]>;
export type GetProps<T extends React.ComponentType<any> | object> = T extends React.ComponentType<infer P> ? P : T extends object ? T : never;
export type GetProp<T extends React.ComponentType<any> | object, PropName extends keyof GetProps<T>> = NonNullable<GetProps<T>[PropName]>;
//type Components<T extends React.ComponentType<any>>=Record<string,T extends React.ComponentType<infer P>?P:T extends object?T:never>
 

const getComponent=<T extends Record<string,React.ComponentType<any>>,K extends keyof T=keyof T>(components:T,name:K)=>{
    return components[name] as T[K]
}
const setComponents=(components:Record<string,any>,name:string,value:any)=>{
    components[name]=value
}
const registerComponent=(name:string,Component:React.ComponentType<any>)=>{
    setComponents(components,name,Component)
}
const 
export {
    getComponent,
    registerComponent
}
