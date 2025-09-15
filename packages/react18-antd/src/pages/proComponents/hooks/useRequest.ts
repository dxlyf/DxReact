import { useCallback, useRef, useState } from "react"

type UseRequestOptions<D=any,T=any>={
    request:(params:T)=>Promise<D> 
}
type UseRequestState<D=any>={
    data:D|undefined
    loading:boolean
    lastParams:any
}
export const useRequest=<D=any,T=any>(options:UseRequestOptions<D,T>)=>{
    const latestOptions=useRef<UseRequestOptions<D,T>>(options)
    latestOptions.current=options
    const dataRef=useRef<UseRequestState<D>>({
        data:undefined,
        loading:false,
        lastParams:{}
    })
    const [_,setUpdate]=useState(false)
    const forceUpdate=useCallback(()=>{
        setUpdate(v=>!v)
    },[])
    const request=useCallback(async (params:T)=>{
       const newParams={...params}
       dataRef.current.lastParams=newParams
       let result:D;
       try{
            dataRef.current.loading=true
            forceUpdate()
            result=await latestOptions.current.request(newParams)
       }catch(e){
            return Promise.reject(e)
       }finally{
            dataRef.current.loading=false
            forceUpdate()
       }
       return result
    },[])
    const run=useCallback(async (params:T)=>{
        return request({...dataRef.current.lastParams,...params})
    },[request])
    const refresh=useCallback(async (params:T)=>{
        return request({...params})
    },[request])
    return {
        data:dataRef.current.data,
        loading:dataRef.current.loading,
        params:dataRef.current.lastParams as T,
        run,
        refresh
    }
}
