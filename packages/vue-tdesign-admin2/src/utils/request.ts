import axios, { type AxiosRequestConfig, type AxiosResponse, AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { MessagePlugin } from 'tdesign-vue-next'

export type RequestConfig<P = any> = {
    showError?: boolean
} & AxiosRequestConfig<P>
export type ResponseResult<T = any> = {
    code: number,
    msg: string,
    data: T | null
}
export class BizResponseError<T = unknown, D = any> extends AxiosError<T, D> {
    // constructor(message?: string,
    //     code?: string,
    //     config?: InternalAxiosRequestConfig<D>,
    //     request?: any,
    //     response?: AxiosResponse){
    //     super(message, code, config, request, response)
    // }
}
const instance = axios.create({
    baseURL: '/api',
    timeout: 5000,
    showError: true
} as RequestConfig)
instance.interceptors.request.use((config) => {
    return config
})
instance.interceptors.response.use((res) => {
    const data = res.data as ResponseResult
    if (data.code !== 200) {
        throw new BizResponseError(data.msg, data.code + '', res.config, res.request, res)
    }
    return res
})
instance.interceptors.response.use(undefined, (error) => {
    if (error instanceof BizResponseError || error instanceof AxiosError) {
        const config = error.config as RequestConfig
        if (config.showError) {
            MessagePlugin.error(error.message)
        }
    } 
    throw error

})


export const request = <P, D>(config: RequestConfig<P>): Promise<ResponseResult<D>> => {
    return instance.request(config).then(res => {
        return res.data as ResponseResult<D>
    })
}