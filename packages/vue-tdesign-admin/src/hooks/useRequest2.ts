import { shallowReactive } from "vue";


export type UseRequestProps<T,Paramater extends Record<string,any>={}>={
    request:(params:Paramater)=>Promise<T>
    transform?:(data:T)=>T
    onSuccess?:(data:T,params:Paramater)=>void // 请求成功回调
    onFail?:(error:unknown)=>void // 请求失败回调
    onComplete?:()=>void // 请求完成回调    
    manualRequest?:boolean // 是否手动触发请求
    deafultParams?:Paramater
    defaultValue?:T
}
export type UseRequestState<T,Paramater extends Record<string,any>={}>={
    loading:boolean
    error:any
    lastParams:Paramater
    data:T
}
export const useRequest=<T,Paramater extends Record<string,any>={}>(props:UseRequestProps<T,Paramater>)=>{
    const {request:propRequest,defaultValue=null,manualRequest=false,onSuccess,onFail,onComplete}=props
  
    const state = shallowReactive<UseRequestState<T,Paramater>>({
        loading: false,
        data: defaultValue as T,
        error: null,
        lastParams: {} as Paramater,
    });
    /**
     * 触发请求
     * @param params 请求参数
     * @returns 
     */
    const request=async (params={})=>{
        state.loading=true
        state.error=null
        try {
            const newParams={
                ...params
            }
            let data:T=await propRequest(newParams as Paramater)
            if(props.transform){
                data=props.transform(data)
            }
            state.data=data as T
            state.lastParams=params as Paramater
            onSuccess?.(data,newParams as Paramater)
            return data
        } catch (error) {
            state.error=error
            onFail?.(error)
            throw error
        }finally{
            state.loading=false
            onComplete?.()
        }
    }
    // 重试上次请求
    const retry=async ()=>{
        return request(state.lastParams)
    }
    if(!manualRequest){
        request(props.deafultParams??{})
    }
    return [state, { request,retry }] as const
}