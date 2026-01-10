import { useState,useCallback,useRef } from 'react'
import useMemoizedFn from './useMemoizedFn' 
import useControllerValue,{type UseControllerValueProps} from './useControllerValue' 

type UseValueChangeProps<T>=UseControllerValueProps<T>&{
    equals?:(value:T,previousValue:T)=>boolean
}
const shallowEqual=(value:any,previousValue:any)=>{
    if(value===previousValue) return true
    return false
}
const useValueChange=<T>(props:UseValueChangeProps<T>)=>{
    const {equals=shallowEqual,...restProps}=props
    const [value,setValue]=useControllerValue(restProps)
    const previousRef=useRef(null)
    const onChange=useMemoizedFn((value:any)=>{
        previousRef.current=value
        setValue(value)
    })
    const isChanged=equals(value,previousRef.current)
    if(isChanged){
        previousRef.current=value
    }
    return [value,onChange,{
        isChanged,
        setValue
    }] as const
}

export default useValueChange