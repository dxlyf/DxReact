import {useSyncExternalStore,useReducer} from 'react'
import type {Reducer} from 'react'
import Mitt,{type Emitter} from 'src/utils/mitt'

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
    private mitt=Mitt<DataSourceEvents<D,P>>()
    private params: P = {} as P;
    private update:()=>void
    private options:DataSourceOptions<D,P>
    constructor(options:DataSourceOptions<D,P>){
        this.options=options
    }
    async request(params:P){
        this.loading=true
        try{
            this.mitt.emit('requestStart',{params:params})
            const data = await this.options.request(params)
            this.params = params;
            this.setData(data)
            this.mitt.emit('requestEnd',{data:this.data})
        }catch(e){
            this.mitt.emit('requestError',{error:e})
            throw e
        }finally{
            this.loading=false
            this.mitt.emit('requestComplete',{data:this.data})
        }
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

const useDataSource=()=>{


}


