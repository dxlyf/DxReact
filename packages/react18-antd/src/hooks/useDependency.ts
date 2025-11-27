import { useMemo, useRef } from "react"

const shallowCompare=(a:any,b:any)=>{
    if(a===b) return true
    if(typeof a!=='object'||typeof b!=='object') return false
    if(Object.keys(a).length!==Object.keys(b).length) return false
    for(const key in a){
        if(a[key]!==b[key]){
            return false
        }
    }
    return true
}
const depCompare=(a:any,b:any)=>{
    if(a===b){
         return true
    }
    if(a===null||b===null||typeof a!=='object'||typeof b!=='object'){
         return false
    }
    if(Object.keys(a).length!==Object.keys(b).length){
         return false
    }
    if(a.constructor!==b.constructor){
        return false
    }
    for(const [key] of Object.entries(a)){
        if(!depCompare(a[key],b[key])){
            return false
        }
    }
    return true
}
const useDependency=(value:any)=>{
    const prev=useRef({value:undefined,version:0})
    useMemo(()=>{
        if(prev.current.value!==undefined&&!depCompare(prev.current.value,value)){
            prev.current.version++
            prev.current.value=value
        }
    },[value])
    return [prev.current.version]
}
export default useDependency