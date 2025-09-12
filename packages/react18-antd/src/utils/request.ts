import axios from 'axios'
import type {AxiosRequestConfig,AxiosResponse,AxiosError} from 'axios'


export type ResponseData<D=any>={
    code:number
    data:D,
    msg?:string
}
export type RequestConfig<D=any>=AxiosRequestConfig<D>&{

}

const defaultConfig:Parameters<typeof axios.create>[0]={
    baseURL:'/api/',
    responseType:'json'
}
class ResponseError extends axios.AxiosError{
    
}
const intance=axios.create(defaultConfig)

intance.interceptors.response.use((res)=>{
    const reqConfig=res.config as RequestConfig
    return res.data
},(err:any)=>{

})
const _request=<T=any,D=any>(config:RequestConfig<D>)=>{
    return intance.request<T,ResponseData<T>,D>(config) as Promise<ResponseData<T>>
}
export {
    _request as request
}