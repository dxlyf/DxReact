import { useCallback, useState } from "react"


const useUpdate=()=>{
    const [_,setUpdate]=useState(false)

    const forceUpdate=useCallback(()=>{
    setUpdate(v=>!v)
    },[])
    return forceUpdate
}
export default useUpdate