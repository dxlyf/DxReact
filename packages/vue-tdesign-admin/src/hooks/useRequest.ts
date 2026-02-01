import { ref,shallowRef,shallowReactive,reactive,computed, onMounted, watch} from 'vue'

type ServiceHandle<T>=(params:any)=>Promise<T>
export type UseRequestOptions<T>={
    manual?:boolean
    service:ServiceHandle<T>
    transform?:(data:T)=>T
    params?:any
    defaultValue?:T
    pagination?:{
        defaultPageSize?:number
        defaultCurrent?:number
        pageSizeField?:string
        currentField?:string
    }
}
const useRequest=<T>(options:UseRequestOptions<T>)=>{
    const {service,transform,params,manual=false,defaultValue,pagination}=options
    const {pageSizeField='pageSize',currentField='current',defaultPageSize=20,defaultCurrent=1}=pagination||{}
    const state=shallowReactive({
        loading:false,
        data:defaultValue,
        current:defaultCurrent,
        pageSize:defaultPageSize,
        error:null
    })
    let lastParams=shallowRef({})
 
    const request=async (params:any={})=>{
        if(state.loading){
            return state.data
        }
        state.loading=true
        try{
            const newParams={
                ...params
            }
            if(pagination){
                state.current=newParams[currentField]||defaultCurrent
                state.pageSize=newParams[pageSizeField]||defaultPageSize
            }
            const res=await service(params)
            lastParams.value={...params}
            state.data=transform?transform(res):res
        }catch(err){
            state.error=err
        }finally{
            state.loading=false
        }
        return state.data
    }
    const query=async (params:any={})=>{
        return request(params)
    }
    const refresh=async (params:any={})=>{
        return request({
            ...params,
            ...(pagination?({
                [currentField]:1,
                [pageSizeField]:state.pageSize,
            }):{})
        })
    }
    const onTableChange=(data:any,context:any)=>{
        const {pagination}=data||{}
        query({
            ...lastParams.value,
            ...(pagination?({
                [currentField]:pagination.current,
                [pageSizeField]:pagination.pageSize,
            }):{})
        })
    }
    onMounted(()=>{
        if(!manual){
            refresh(params)
        }
    })
    return [state,{
        request,
        query,
        refresh,
        onTableChange,
        lastParams
    }] as const
}
export default useRequest