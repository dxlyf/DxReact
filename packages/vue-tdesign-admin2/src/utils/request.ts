import router from '@/router'
import axios, { type AxiosRequestConfig, type AxiosResponse, AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { MessagePlugin } from 'tdesign-vue-next'

export type RequestConfig<P = any> = {
    showError?: boolean
} & AxiosRequestConfig<P>
export type ResponseResult<T = any> = {
    code: number,
    isSuccess: boolean,
    message: string,
    data: T | null
}

const instance = axios.create({
    baseURL: '/',
    timeout: 60000,
    showError: true
} as RequestConfig)

const hasOwnProperty=(obj:any,prop:string)=>{
    return Object.prototype.hasOwnProperty.call(obj,prop)
}
const isStandardFormat=(data:any)=>{
    const isObj=Object.prototype.toString.call(data)==='[object Object]'
    if(!isObj|| !hasOwnProperty(data,'code')){
        return false
    }
    return true
}
const normalizeResponseData = (data: any): ResponseResult => {
    return {
        code: 0,
        isSuccess: true,
        message: 'ok',
        data: null,
        ...(isStandardFormat(data)?data:{data:data})
    }
}
instance.interceptors.request.use((config) => {
    return config
})
instance.interceptors.response.use((res) => {
    const data = normalizeResponseData(res.data) as ResponseResult
    if (data.code !== 0) {
        //throw AxiosError.from(error)
        // throw new BizResponseError(data.message, data.code + '', res.config, res.request, res)
        throw new AxiosError(data.message, data.code + '', res.config, res.request, res)
    }
    return res
})
instance.interceptors.response.use(undefined, (error) => {
    if (error instanceof AxiosError) {
        const status = error.response?.status
        const config = error.config as RequestConfig
        const message = error.message
        const showError = config.showError
        const errorCode = error.code as string
        let errorMsg = ''

        if (status === 200 && status <= 300) {
            errorMsg = '【业务错误】:' + error.message
        }
        else if (message === 'Network Error') {
            errorMsg = '网络错误，请检查网络连接'
        } else if (message === 'Request timeout' || message.includes('timeout')) {
            errorMsg = '请求超时，请稍后重试'
        } else if (status === 401) {
            errorMsg = '登录过期，请重新登录'
            router.push('/login')
        } else if (status === 403) {
            errorMsg = '没有权限访问'
        } else if (status === 404) {
            errorMsg = '请求的资源不存在'
        } else if (status && status >= 500) {
            errorMsg = '服务器内部错误，请稍后重试'
        } else {
            errorMsg = '请求失败，请稍后重试'
        }
        if (showError && errorMsg !== '') {
            MessagePlugin.error(errorMsg)
        }
        console.error(`[请求失败] 状态码：${status},错误码:${error.code}，错误信息：${message}`, error)
    } else {
        // 非 Axios 异常
        console.error('[请求失败] 未知错误', error)
        MessagePlugin.error('请求失败，请稍后重试')
    }
    throw error
})


export const request = <Data = any, Paramter = any>(config: RequestConfig<Paramter>): Promise<ResponseResult<Data>> => {
    return instance.request(config).then(res => {
        return res.data as ResponseResult<Data>
    })
}
export type { AxiosError }
