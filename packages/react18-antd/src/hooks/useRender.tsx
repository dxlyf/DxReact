import React, { useLayoutEffect, useMemo, useRef, useState } from "react"
import { useCallback } from "react"

type UseRenderOptions={
    visible?:boolean // 是否显示
    destroyOnClose?:boolean // 	不可见时是否销毁 DOM 结构
    forceRender?:boolean // 被隐藏时是否渲染 DOM 结构
}
type UseControllableValueProps={
    defaultValue?:any // 默认值
    defaultValuePropName?:string // 自定义 defaultValue 的属性名
    valuePropName?:string // 自定义 value 的属性名
    trigger?:string 
    hasControlled?:(val:any)=>boolean
    [K:string]:any
}
function defaultIsControlled(value:any){
    return value!==undefined
}
export const useControllableValue=(props:UseControllableValueProps)=>{
     const { valuePropName='value',
        defaultValuePropName='defaultValue',
        trigger='onChange',
        defaultValue,
        hasControlled=defaultIsControlled}=props
    
     const [,update]=useState(false)
     const value=props[valuePropName as keyof UseControllableValueProps]
     const isControlled=hasControlled!(value)
     const initialValue=useMemo(()=>{
        if(isControlled){
            return value
        }
        if(Object.prototype.hasOwnProperty.call(props,defaultValuePropName as keyof UseControllableValueProps)){
            return props[defaultValuePropName as keyof UseControllableValueProps]
        }
        return defaultValue
     },[])


    const valueRef=useRef(initialValue)
    if(isControlled){
        valueRef.current=value
    }
    const setValue=(value:any,...args:any[])=>{
        const newValue=typeof value==='function'?value(valueRef.current):value
        if(!isControlled){
            valueRef.current=newValue
            update(v=>!v)
        }
        if(props[trigger]){
            props[trigger as keyof UseControllableValueProps](...([value].concat(args)))  
        } 
    }
    return  [valueRef.current,setValue]
}
export const useRenderElement=(options:UseRenderOptions)=>{
    const {visible:propVisible,forceRender,destroyOnClose}=options
    const [visible,setVisible]=useControllableValue({
        defaultValue:false,
        value:propVisible
    })

    const render=useCallback((element:React.ReactElement|((visible:boolean)=>React.ReactNode))=>{
        const isFunc=typeof element==='function'
        if(visible){
            return isFunc?element(true):element
        }else if(forceRender||!destroyOnClose){
            return isFunc?element(false):React.cloneElement(element,{
                style:{
                    display:'none'
                }
            })
        }
        return null
    },[visible,forceRender,destroyOnClose])

    return [visible,{setVisible,render}] as const
}

