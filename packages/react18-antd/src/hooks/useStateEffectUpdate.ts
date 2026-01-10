import { useEffect, useState } from "react"

const useStateEffectUpdate=<S>(payload:S|(()=>S),deps:any[]=[])=>{
    const [state,setState]=useState(payload)
    useEffect(()=>{
         setState(payload)
    },deps)
    return [state,setState]
}