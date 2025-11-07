import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import useMemoizedFn from "./useMemoizedFn"

type Pagation = {
    current?: number
    pageSize?: number
    total?: number
}
const USER_REQUEST=1<<0
const INIT_REQUEST=1<<1
const DEP_REQUEST=1<<2
export type UseRequestOptions<Data> = {
    request?: ServiceHandle<any>
    defaultData?: Data | (() => Data)
    data?:Data
    requestParams?: any
    dependencies?: any[]
    manualRequest?: boolean
    ready?: boolean
    debounceWaitTime?: number
    pagation?: false | Pagation
    transform?: (data: Data, previous: Data | undefined, params: any) => Data
    onChange?:(data:Data,flag:Number)=>void
}
type ServiceHandle<Data> = (params: any, lastParams?: any) => Data | Promise<Data>

const debounce = (fn: (...args: any[]) => any, wait: number) => {
    let timeout: ReturnType<typeof setTimeout> | null = null
    let lastThat: any = null
    let lastArgs: any = null
    let lastResult: any
    function debounced(this: any, ...args: any[]) {
        if (timeout) {
            clearTimeout(timeout)
            timeout = null
        }
        lastArgs = args
        lastThat = this
        timeout=setTimeout(() => {
            lastResult = fn.apply(lastThat, lastArgs)
            lastArgs = null
            lastThat = null
            timeout = null
        }, wait)
        return lastResult;
    }
    function cancel() {
        clearTimeout(timeout)
        timeout = null
        lastArgs = null
        lastThat = null
    }
    
    debounced.cancel = cancel
    return debounced
}
const debouncePromise = (fn: (...args: any[]) => any, wait: number) => {
    let resolveCallback: any, rejectCallback: any, pendingPromise: any = null,stoped=false;
    let executing=false
    const debounceFn = debounce(async function (this: any, ...args: any[]) {     
        if(stoped){
            return
        }
        try {
            executing=true
            const ret = await fn.apply(this, args)
            resolveCallback(ret)
        } catch (e) {
            rejectCallback(e)

        } finally {
            pendingPromise = null
            rejectCallback = null
            resolveCallback = null
            executing=false
        }
    }, wait)
     function debouncedPromise(this: any, ...args: any[]): Promise<any> {
        if (!pendingPromise) {
            pendingPromise = new Promise((resolve, reject) => {
                resolveCallback = resolve;
                rejectCallback = reject;
            });
        }
        if(!executing){
           debounceFn.apply(this, args)
        }
        return pendingPromise
    }
    debouncedPromise.destroy=()=>{
        debounceFn.cancel()
        stoped=true

        pendingPromise = null
        resolveCallback = null
        rejectCallback = null
    }
    return debouncedPromise
}



const useRequest = <D = any>(options: UseRequestOptions<D> = {}) => {
    const {request:propRequest,data:propData,defaultData,onChange, dependencies = [], requestParams, pagation = false, ready, debounceWaitTime, manualRequest = false, transform } = options
    const lastParams = useRef<any>({})
    const [state] = useState({ init:false,mounted: false, unMounted: false })
    const isControlled=propData!==undefined
    const [innerData, setInnerData] = useState<D>(()=>{
        if(isControlled){
            return propData
        }
        if(typeof defaultData==='function'){
            return (defaultData as Function)()
        }
        return defaultData
    })
    const data=isControlled?propData:innerData
    const [error, setError] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const pagationInfoRef= useRef<Pagation>(null)
    if(!pagationInfoRef.current){
        pagationInfoRef.current={
            pageSize: 10,
            current: 1,
            total: 0,
            ...(pagation ? pagation : {})
        }
    }
    const needPagation = pagation !== false
    const setPagationInfo=useCallback((playload:Pagation|((p:Pagation)=>Pagation))=>{
        pagationInfoRef.current=typeof playload==='function'?playload(pagationInfoRef.current):{...pagationInfoRef.current,...playload}
    },[])
    const request = useMemoizedFn(async (params: any,flag:number=USER_REQUEST) => {
        let res: any = undefined
        try {
            setLoading(true)
            setError(null)
            const newParams = {
                ...params,
                ...(needPagation ? {
                    current: pagationInfoRef.current.current,
                    pageSize: pagationInfoRef.current.pageSize
                } : {})
            }
            if(propRequest&&!isControlled){
                 res = await propRequest(newParams, lastParams.current)
                if (state.unMounted) {
                    return
                }
                if (transform) {
                    res = transform(res, data, newParams)
                }
                lastParams.current = newParams
                if (needPagation) {
                    setInnerData(res.data)
                    setPagationInfo({ total: res.total })
                } else {
                    setInnerData(res)
                }
            }
            onChange?.(res,flag)
        } catch (e) {
            setError(e)
        } finally {
            setLoading(false)
        }
        return res
    })
    const debounceRequest = useMemo(() => {
        if (typeof debounceWaitTime === 'number') {
            return debouncePromise(request, debounceWaitTime)
        }
        return request
    }, [debounceWaitTime, request])
    const read = useCallback(async (params: any = {}, memory: boolean = false) => {
        const newParams = {
            ...(memory ? lastParams.current : {}),
            ...params
        }
        return debounceRequest(newParams)
    }, [debounceRequest])
    useLayoutEffect(() => {
        if (state.mounted && dependencies.length > 0) {
            request(requestParams,DEP_REQUEST)
        }
    }, dependencies)
    useLayoutEffect(() => {
        if ((ready === undefined || ready) && !manualRequest && !state.init) {
            state.init=true
            request(requestParams,INIT_REQUEST)
        }
        state.mounted = true
        return () => {
            state.unMounted = true
        }
    }, [ready, manualRequest])
    useEffect(()=>{
        return ()=>{
            (debounceRequest as any).destroy&&(debounceRequest as any).destroy()
        }
    },[debounceRequest])

    return {
        loading,
        data:data as D,
        error,
        lastParams,
        pagationInfo:pagationInfoRef.current,
        setPagationInfo,
        setError,
        setData:setInnerData,
        setLoading,
        read,
        request
    }
}
useRequest.FLAGS={
    USER_REQUEST,
    INIT_REQUEST,
    DEP_REQUEST
}
export default useRequest