import React, { useRef, useState } from "react"



type UseShouldRenderProps={
    active?:boolean // 当前是否激活
    destroyOnClose?:boolean //关闭时销毁 Modal 里的子元素
    forceRender?:boolean // 	被隐藏时是否渲染 DOM 结构
    render:(props:{style:React.CSSProperties})=>React.ReactNode // 自定义渲染内容

}
export const useShouldRender=(props:UseShouldRenderProps)=>{
    const {render,active=false,destroyOnClose=false,forceRender=false}=props
    const activated=useRef(active)
    if(active){
        activated.current=true
    }
    let dom:any=null
    let shouldRender=active||forceRender||activated.current&&!destroyOnClose
    if(shouldRender){
        const styleProps:React.CSSProperties=active?{}:{
            display:'none'
        }
        dom= render({style:styleProps})
    }
    return dom
}
export const ShouldRender=(props:Partial<UseShouldRenderProps>&{children?:React.ReactElement})=>{
    const dom=useShouldRender({
        render:()=>{
            return props.children
        },
        ...props
    })
    return dom
}