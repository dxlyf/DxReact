import { useReducer } from "react"

const reducerHandle=(v:boolean)=>!v

const useUpdate=()=>{
    const [_,forceUpdate]=useReducer(reducerHandle,false)
    return forceUpdate
}
export default useUpdate