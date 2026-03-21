import { shallowReactive } from "vue";


export type UseRequestProps<T,Paramater extends Record<string,any>={}>={
    request:(params:Paramater)=>Promise<T>
    transform?:(data:T)=>T
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
    const {request:propRequest,defaultValue=null,manualRequest=false}=props
  
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
            return data
        } catch (error) {
            state.error=error
            throw error
        }finally{
            state.loading=false
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