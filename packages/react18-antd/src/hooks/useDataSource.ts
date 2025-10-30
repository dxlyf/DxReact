import {useSyncExternalStore,useReducer, useState} from 'react'
import type {Reducer} from 'react'
import Mitt,{type Emitter} from 'src/utils/mitt'
import { useMemoizedFn } from './hooks'

type DataSourceEvents<D,P>={
    requestStart:{params:P},
    requestEnd:{data:D},
    requestError:{error:any},
    requestComplete:{data:D|null},
    change:{
        data:D
    }
}
interface IDataSource<D,P extends Record<string,any>>{
    data:D|null
    loading:boolean

    read(params:P):Promise<D>
    refresh(params:P):Promise<D>
}
type DataSourceOptions<D,P>={
    defaultData?:D
    debounce?:number
    cache?:boolean
    update:()=>void
    request:(params:P)=>Promise<D>
}
class DataSource<D,P extends Record<string,any>> implements IDataSource<D,P>{
    public data:D|null=null
    public loading=false
    public error:any=null
    private mitt=Mitt<DataSourceEvents<D,P>>()
    private params: P = {} as P;
    private update:()=>void
    private options:DataSourceOptions<D,P>
    constructor(options:DataSourceOptions<D,P>){
        this.options=options
    }
    async request(params:P){
        this.loading=true
        this.error=null
        let ret;
        try{
            this.mitt.emit('requestStart',{params:params})
            ret= await this.options.request(params)
            this.params = params;
            this.setData(ret)
            this.mitt.emit('requestEnd',{data:this.data})
        }catch(e){
            this.mitt.emit('requestError',{error:e})
            this.setError(e)

        }finally{
            this.loading=false
            this.mitt.emit('requestComplete',{data:this.data})
        }
        return ret
    }
    setError(e:any){
        this.error=e;
        this.update()
    }
    setData(data:D){
        this.data=data
        this.mitt.emit('change',{data:this.data})
        this.update()
    }
    async read(params: P): Promise<D> {
        await this.request({...this.params,...params});
        return this.data as D;
    }

    async refresh(params: P): Promise<D> {
        await this.request(params);
        return this.data as D;
    }
}
class ArrayDataSource<D,P extends Record<string,any>> extends DataSource<D[],P>{
    constructor(options:DataSourceOptions<D[],P>){
        super(options)
    }
    
}

const useDataSource=(service:(params:any)=>any)=>{
    const [,update]=useReducer(v=>v+1,0)

    const request=useMemoizedFn(async(params)=>{
        return service(params)
    })
    const [dataSource,setDataSource]=useState(()=>{
        return new DataSource({
            update:update,
            request
        })
    })
    
    return [dataSource]
}
export default useDataSource


