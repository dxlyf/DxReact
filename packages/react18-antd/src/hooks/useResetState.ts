import { useCallback, useState } from "react"

const useResetState=<S>(initialState:S|(()=>S))=>{
    const [state,setState]=useState<S>(initialState)

    const resetState=useCallback(()=>{
        setState(typeof initialState==='function'?(initialState as (()=>S))():initialState)
    },[])
    return [state,setState,resetState] as const
}
export default useResetState 