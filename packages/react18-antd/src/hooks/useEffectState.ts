import { useEffect, useState } from "react"


const useEffectState=<S>(initialState:S|(()=>S))=>{
    const [state,setState]=useState<S>(initialState)

    useEffect(()=>{
        return ()=>{
             setState(initialState)
        }
    },[])
    return [state,setState]
}
export default useEffectState