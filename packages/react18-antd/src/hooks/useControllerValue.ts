import { useMemoizedFn } from "ahooks"
import { useCallback, useRef, useState } from "react"

export type UseControllerValueProps<T>={
    value?:T
    defaultValue?:T|(()=>T)
    onChange?:(value:T,...args:any[])=>void
}
const useControllerValue=<T>(props:UseControllerValueProps<T>)=>{
    const {value:propValue,defaultValue,onChange}=props
    const isControlled=propValue!==undefined
    const [innerValue,setInnerValue]=useState<T>(()=>{
        if(isControlled){
            return propValue
        }
        if(typeof defaultValue==='function'){
            return (defaultValue as Function)()
        }
        return defaultValue
    })
    const value=isControlled?propValue:innerValue
    const triggerChange=useMemoizedFn((predicate:T|((value:T)=>T),...extra:any[])=>{
        const newVal=typeof predicate==='function'?(predicate as Function)(value):predicate
        if(!isControlled){
            setInnerValue(newVal)
        }
        onChange?.(newVal,...extra)
    })
    return [value,triggerChange] as const
}
export default useControllerValue