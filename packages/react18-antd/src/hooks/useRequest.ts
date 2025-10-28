import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react"
import useMemoizedFn from "./useMemoizedFn"

type useRequestOptions<Data>={
    defaultData?:Data|(()=>Data)
    params?:any
    dependencies?:any[]
    manualRequest?:boolean
    ready?:boolean
    debounce?:number
    transform?:(data:Data,previous:Data|undefined,params:any)=>Data
    onSuccess?:(data:Data)=>void
    onFail?:(e:any)=>void
    onComplete?:(data:Data|undefined,previous:Data|undefined)=>void

}
type ServiceHandle<Data>=(params:any,lastParams?:any)=>Data|Promise<Data>

const useRequest=<D=any>(service:ServiceHandle<D>,options:useRequestOptions<D>={})=>{
    const {onComplete,onFail,ready,debounce,manualRequest=false,onSuccess,defaultData,transform}=options
    const lastOptions=useRef<useRequestOptions<D>>(options)
    lastOptions.current=options
    const lastParams=useRef<any>({})
    const [state]=useState({init:false})
    const [data,setData]=useState(defaultData)
    const [loading,setLoading]=useState(false)
    const debounceService=useMemo(()=>{
        if(typeof debounce==='number'&&debounce>0){
            
        }
    },[debounce])
    const request=useMemoizedFn(async (params:any)=>{
        let nextData:D|undefined=undefined
        try{
            setLoading(true)
            const newParams={
                ...params
            }
            nextData=await service(newParams,lastParams.current)
            if(transform){
                nextData=transform(nextData,data,newParams)
            }
            lastParams.current=newParams
            setData(nextData)
            onSuccess?.(nextData)
        }catch(e){
            onFail?.(e)
        }finally{
            setLoading(false)
            onComplete?.(nextData,data)
        }
        return nextData as D
    })
    const read=useCallback(async (params:any={})=>{
        return request({...lastParams.current,...params})
    },[request])
    const refresh=useCallback(async (params:any={})=>{
        return request({...(lastOptions.current.params||{}),...params})
    },[request])
    useLayoutEffect(()=>{
        if((ready===undefined||ready)&&!manualRequest&&!state.init){
            state.init=true
            refresh()
        }
    },[ready,manualRequest])
    const ret=useMemo(()=>({
        loading,
        data,
        lastParams,
        setData,
        setLoading,
        request,
        refresh,
        read
    }),[data,loading])
    return ret
}

export default useRequest