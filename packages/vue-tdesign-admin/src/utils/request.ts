import axios,{AxiosError,type InternalAxiosRequestConfig,type AxiosResponse,type AxiosRequestConfig} from 'axios'
import { t } from 'src/i18n'
import router from 'src/router'
import {MessagePlugin} from 'tdesign-vue-next'

export type ResponseData<T = unknown> = {
    code: number
    msg: string
    data: T
}
class ProAxiosError<T = unknown, D = ResponseData> extends AxiosError{
    constructor(message?: string,
    code?: string,
    config?: InternalAxiosRequestConfig<D>,
    request?: any,
    response?: AxiosResponse<T, D>,){
        super(message,code,config,request,response)
    }
}
// 扩展请求配置
export interface RequestConfig<D = any> extends AxiosRequestConfig<D> {
    skipBusinessErrorHandler?: boolean // 是否跳过全局的业务错误，自行处理
}
const DEFAULT_CONFIG:RequestConfig={
    baseURL: '/api',
    timeout: 10000,
    responseType:'json',
    skipBusinessErrorHandler:false
}
const instance = axios.create(DEFAULT_CONFIG)

instance.interceptors.request.use(
    (config) => {
        // 在发送请求之前做些什么
        return config
    },
    (error) => {
        // 对请求错误做些什么
        return Promise.reject(error)
    }
)

instance.interceptors.response.use(
    (response) => {
        // 2xx 范围内的状态码都会触发该函数。
        // 对响应数据做点什么
        const data=response.data as any
        if(data.code!==0){
            return Promise.reject(new ProAxiosError(data.msg,data.code,response.config,response.request,response))
        }
        return response
    },
    (error) => {
        // 超出 2xx 范围的状态码都会触发该函数。
        // 对响应错误做点什么
        return Promise.reject(error)
})


instance.interceptors.response.use(
    (response) => {
        // 2xx 范围内的状态码都会触发该函数。
        // 对响应数据做点什么
        return response
    },
    (error:AxiosError) => {
        // 超出 2xx 范围的状态码都会触发该函数。
        // 对响应错误做点什么
        if(error instanceof ProAxiosError){
            // 处理自定义错误
            if(!(error.config as RequestConfig)?.skipBusinessErrorHandler){
                // 处理业务错误
                MessagePlugin.error(error.message)
            }
        }else if(error.response){
            const status=error.response?.status

            // 处理其他错误
            if(status===401){
                // 处理未授权错误
                MessagePlugin.error(t('message.unauthorized'))
                // 处理未授权错误，例如跳转到登录页
                router.push('/login')
            }
            if(error.response?.status===403){
                // 处理禁止访问错误
            }
            if(error.response?.status===404){
                // 处理资源不存在错误
            }
            if(error.response?.status===500){
                // 处理服务器错误
            }

        }
        return Promise.reject(error)
})
const request = <T, D = any>(config?: RequestConfig<D>) => {
    return instance.request<ResponseData<T>>(config).then((res)=>res.data)
}
const get = <T, D = any>(url: string,config?: RequestConfig<D>) => {
    return instance.get<ResponseData<T>>(url,config).then((res)=>res.data)
}
const post = <T, D = any>(url: string,data?:D,config?: RequestConfig<D>) => {
    return instance.post<ResponseData<T>>(url,data,config).then((res)=>res.data)
}
const del = <T, D = any>(url: string,config?: RequestConfig<D>) => {
    return instance.delete<ResponseData<T>>(url,config).then((res)=>res.data)
}
const put = <T, D = any>(url: string,data?:D,config?: RequestConfig<D>) => {
    return instance.put<ResponseData<T>>(url,data,config).then((res)=>res.data)
}
const patch = <T, D = any>(url: string,data?:D,config?: RequestConfig<D>) => {
    return instance.patch<ResponseData<T>>(url,data,config).then((res)=>res.data)
}
export {
    instance,
    request,
    get,
    post,
    del,
    put,
    patch
}