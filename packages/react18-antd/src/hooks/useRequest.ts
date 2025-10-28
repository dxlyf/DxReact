import { useCallback, useMemo, useRef, useState } from "react"
import useMemoizedFn from "./useMemoizedFn"

type useDataOptions<Data>={
    defaultData?:Data|(()=>Data)
    transform?:(data:Data,previous:Data|undefined,params:any)=>Data
    onSuccess?:(data:Data)=>void
    onFail?:(e:any)=>void
    onComplete?:(data:Data|undefined,previous:Data|undefined)=>void

}
type ServiceHandle<Data>=(params:any,lastParams?:any)=>Data|Promise<Data>

const useRequest=<D=any>(service:ServiceHandle<D>,options:useDataOptions<D>={})=>{
    const {onComplete,onFail,onSuccess,defaultData,transform}=options

    const lastParams=useRef<any>({})
    const [data,setData]=useState(defaultData)
    const [loading,setLoading]=useState(false)
    const request=useMemoizedFn(async (params:any)=>{
        let nextData:D|undefined=undefined
        try{
            setLoading(true)
            nextData=await service(params,lastParams.current)
            if(transform){
                nextData=transform(nextData,data,params)
            }
            lastParams.current=params
            setData(nextData)
            onSuccess?.(nextData)
        }catch(e){
            onFail?.(e)
        }finally{
            setLoading(false)
            onComplete?.(nextData,data)
        }
    })
    const ret=useMemo(()=>({
        loading,
        data,
        lastParams,
        setData,
        setLoading,
        request
    }),[data,loading])
    return ret
}

export default useRequest