import axios, { AxiosError } from 'axios'
import type { AxiosResponse, AxiosInterceptorManager,InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios'
import mitt from 'mitt'
import { MessagePlugin } from 'tdesign-vue-next'
// import app from './app'

const instance = axios.create({
    baseURL: '',
    timeout: 10000,
    skipErrorTip: false
})
type ResposeData<T = any> = {
    code: number,
    message: string,
    data: T
}
type RequestConfig = {
    skipErrorTip?: boolean
} & AxiosRequestConfig
class BizError<T=any,D=any> extends AxiosError {
    isBusinessError: boolean
  constructor(
    message?: string,
    code?: string,
    config?: InternalAxiosRequestConfig<D>,
    request?: any,
    response?: AxiosResponse<T, D>,
  ){
    super(message,code,config,request,response)
  }
}
instance.interceptors.request.use((config) => {
    if (config.baseURL == '/') {
        config.baseURL = import.meta.env.VITE_BASE_URL
    }
    // config.headers['Authorization']=`Bearer ${localStorage.getItem('token')}`
    return config
})

instance.interceptors.response.use((res) => {
    const data = res.data
    if (data.code !== 0) {
        return Promise.reject(new BizError(data.message || '请求失败', data.code + '', res.config, res.request, res))
    }
    return res
}, (error) => {
    return Promise.reject(error)
})
instance.interceptors.response.use((res) => {
    return res
}, (error) => {
    if (error instanceof BizError) {
        const config = (error as BizError).config as RequestConfig
        if (!config.skipErrorTip) {
            MessagePlugin.error(error.message)
        }
        return Promise.reject(error.message)
    } else if (error instanceof AxiosError) {
        const status = error.status
        const code = error.code
        if (code === AxiosError.ECONNABORTED) {
            MessagePlugin.error('请求超时')
        }else if(code===AxiosError.ERR_NETWORK){
            MessagePlugin.error('网络异常，请检查网络连接后重试')
        } else if (status) {
            switch (status) {
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
                    MessagePlugin.error(`请求错误 状态码${status}`)
            }
        }else{
             MessagePlugin.error('请求错误')
        }
    }
    return Promise.reject(error)
})
export const request = <T>(config: RequestConfig) => {
    return instance.request<ResposeData<T>>(config).then(res => res.data)
}

