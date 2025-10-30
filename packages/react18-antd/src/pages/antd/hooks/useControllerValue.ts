import { useMemoizedFn } from "ahooks"
import { useCallback, useRef, useState } from "react"

type UseControllerValueProps<T>={
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
    const triggerChange=useMemoizedFn((value:T,...extra:any[])=>{
        if(!isControlled){
            setInnerValue(value)
        }
        onChange?.(value,...extra)
    })
    return [value,triggerChange] as [T,typeof triggerChange]
}
export default useControllerValue