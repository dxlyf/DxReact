import { useCallback, useEffect, useRef, useState } from "react"

const useSafeState=<S>(initialState: S | (() => S))=>{
    
    const [state,setState]=useState<S>(initialState)
    const ref=useRef(false)
    const setInnerState=useCallback((payload:any)=>{
        if( ref.current){
            return
        }
        setState(payload)
    },[])
    useEffect(()=>{
        ref.current=false
        return ()=>{
            ref.current=true
        }
    },[])
    return [state,setInnerState]
}
export default useSafeState