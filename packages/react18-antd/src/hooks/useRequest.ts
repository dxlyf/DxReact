import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react"
import useMemoizedFn from "./useMemoizedFn"

type Pagation = {
    current?: number
    pageSize?: number
    total?: number
}
export type UseRequestOptions<Data> = {
    request?: ServiceHandle<Data>
    defaultData?: Data | (() => Data)
    data?:Data
    requestParams?: any
    dependencies?: any[]
    manualRequest?: boolean
    ready?: boolean
    debounceWaitTime?: number
    pagation?: false | Pagation
    transform?: (data: Data, previous: Data | undefined, params: any) => Data
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
        setTimeout(() => {
            if (!lastArgs) {
                return
            }
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
    let resolveCallback: any, rejectCallback: any, pendingPromise: any = null;
    const debounceFn = debounce(async function (this: any, ...args: any[]) {
        try {
            const ret = await fn.apply(this, args)
            resolveCallback(ret)
        } catch (e) {
            rejectCallback(e)
        } finally {
            pendingPromise = null
            rejectCallback = null
            resolveCallback = null
        }
    }, wait)
    return function debouncedPromise(this: any, ...args: any[]): Promise<any> {
        if (!pendingPromise) {
            pendingPromise = new Promise((resolve, reject) => {
                resolveCallback = resolve;
                rejectCallback = reject;
            });
        }
        debounceFn.apply(this, args)
        return pendingPromise
    }
}


const useRequest = <D = any>(options: UseRequestOptions<D> = {}) => {
    const {request:propRequest,data:propData,defaultData, dependencies = [], requestParams, pagation = false, ready, debounceWaitTime, manualRequest = false, transform } = options
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
    const [pagationInfo, setPagationInfo] = useState<Required<Pagation>>(() => {
        return {
            pageSize: 10,
            current: 1,
            total: 0,
            ...(pagation ? pagation : {})
        }
    })
    const needPagation = pagation !== false
    const innerRequest = useMemoizedFn(async (params: any) => {
        if(isControlled){
            return
        }
        let res: any = undefined
        try {
            setLoading(true)
            setError(null)
            const newParams = {
                ...params,
                ...(needPagation ? {
                    current: pagationInfo.current,
                    pageSize: pagationInfo.pageSize
                } : {})
            }
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
                setPagationInfo({ ...pagationInfo, total: res.total })
            } else {
                setInnerData(res)
            }
        } catch (e) {
            setError(e)
        } finally {
            setLoading(false)
        }
        return res
    })
    const request = useMemo(() => {
        if (typeof debounceWaitTime === 'number') {
            return debouncePromise(innerRequest, debounceWaitTime)
        }
        return innerRequest
    }, [debounceWaitTime, innerRequest])
    const read = useCallback(async (params: any = {}, memory: boolean = false) => {
        const newParams = {
            ...(memory ? lastParams.current : {}),
            ...params
        }
        return request(newParams)
    }, [request])
    useLayoutEffect(() => {
        if (state.mounted && dependencies.length > 0) {
            read(requestParams)
        }
    }, dependencies)
    useLayoutEffect(() => {
        if ((ready === undefined || ready) && !manualRequest && !state.init) {
            state.init=true
            read(requestParams)
        }
        state.mounted = true
        return () => {
            state.unMounted = true
        }
    }, [ready, manualRequest])
    return {
        loading,
        data:data as D,
        error,
        lastParams,
        pagationInfo,
        setError,
        setData:setInnerData,
        setLoading,
        read
    }
}

export default useRequest