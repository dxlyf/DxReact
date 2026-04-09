import axios,{AxiosError} from 'axios'
import type { AxiosResponse, AxiosInterceptorManager, AxiosRequestConfig } from 'axios'
import mitt from 'mitt'
import {MessagePlugin} from 'tdesign-vue-next'
// import app from './app'

const instance=axios.create({
    baseURL: '',
    timeout: 10000,
})
type ResposeData<T>={
    code:number,
    message:string,
    data:T
}
type RequestConfig={
  skipErrorTip?:boolean
}&AxiosRequestConfig
class ResponseError extends AxiosError{
   isBusinessError:boolean
}
instance.interceptors.request.use((config)=>{
    if(config.baseURL=='/'){
        config.baseURL=import.meta.env.VITE_BASE_URL
    }
   // config.headers['Authorization']=`Bearer ${localStorage.getItem('token')}`
    return config
})

instance.interceptors.response.use((res)=>{
    if(res.data.code!==0){
        return Promise.reject(new ResponseError(res.data.message||'请求失败'))
    }
    return res
},(error)=>{
    return Promise.reject(error)
})
instance.interceptors.response.use((res)=>{
    const data=res.data as ResposeData
    if(data.code!==0){
        return Promise.reject(new ResponseError(data.message||'请求失败',data.code+'',res.config,res.request,res))
    }
    return res
},(error)=>{
    if(error instanceof ResponseError){
        const config=(error as ResponseError).config as RequestConfig
        if(!config.skipErrorTip){
            MessagePlugin.error(error.message)
        }
        return Promise.reject(error.message)
    }else if(error.response){
        const {status,statusText}=(error as AxiosError).response
        switch(status){
            case 400:
                MessagePlugin.error('请求参数错误')
                break
            case 401:
                MessagePlugin.error('未授权，请重新登录')
                break
            case 403:
                MessagePlugin.error('拒绝访问')
                break
            case 404:
                MessagePlugin.error('请求地址错误')
                break
            case 500:
                MessagePlugin.error('服务器内部错误')
                break
            default:
                MessagePlugin.error(statusText)
        }
    }
    return Promise.reject(error)
})
export const request=<T>(config:RequestConfig)=>{
    return instance.request<ResposeData<T>>(config).then(res=>res.data)
}

