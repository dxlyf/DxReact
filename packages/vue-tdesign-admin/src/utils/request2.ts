import axios from 'axios'
import type { AxiosResponse, AxiosInterceptorManager, AxiosRequestConfig, AxiosError } from 'axios'
import mitt from 'mitt'
// import app from './app'


// 服务器返回前端的业务状态码
enum ResponseBusinessStatusCode {
    Success = 200,
    Unauthorized=401
}

// 默认配置
export const defaultRequestConfig:Partial<RequestConfig<any>>={
    baseURL:'',
    showRequestLoadEffect:false,
    showRequestLoadEffectText:'加载中...',
    skipBusinessErrorHandler:false,
    skipHttpErrorHandler:false,
    ignoreBusinessStatusCodeHandler:false,
    retDataField:'value',
    retMsgField:'value',
    retStatusField:'statusCode',
    businessSuccessCodes:[ResponseBusinessStatusCode.Success]
}

// 请求的全局事件对象
export const requestEmitter = mitt<{
    onStartRequest:{
        config:RequestConfig<any>
    },
    onCompleteRequest:{
        config:RequestConfig<any>
    }
}>();


// 状态控制
class GlobalLoading {
    private handler: ReturnType<typeof Toast.show> | null = null
    private requestCount:number=0
    private requestId:any=0
    delayTime:number=200
    constructor() {
  
        requestEmitter.on('onStartRequest',(e)=>{
             //是否显示请求加载效果
            if(e.config.showRequestLoadEffect){
                _globalLoading.show(e.config.showRequestLoadEffectText)
            }
        })
        requestEmitter.on('onCompleteRequest',(e)=>{
            // 完成后，关闭
            if(e.config.showRequestLoadEffect){
                _globalLoading.hide()
            }
        })
    }
    show(showRequestLoadEffectText='加载中...'){
        this.requestCount++
        if (this.requestCount>0) {
            return
        }
       
        this.requestId=setTimeout(()=>{
            // 如果请求过于短，就不显示
            this.handler = Toast.show({
                icon: 'loading',
                content: showRequestLoadEffectText,
                duration:0
            })
        },this.delayTime)
    }
    hide() {
        this.requestCount--
        // 最后一个请求完成后，
        if(this.requestCount<=0){
            this.requestCount=0
            clearTimeout(this.requestId)
            this.requestId=0
        }
        if (this.handler) {
            this.handler.close()
            this.handler=null
      
        }
    }
}
const _globalLoading=new GlobalLoading()

// 扩展请求配置
export interface RequestConfig<D = any> extends AxiosRequestConfig<D> {
    showRequestLoadEffectText?: string // 请求时显示的加载中文字
    showRequestLoadEffect?: boolean // 请求时是否显示加载中
    ignoreBusinessStatusCodeHandler?:boolean// 忽略业务状态码处理
    skipBusinessErrorHandler?: boolean // 是否跳过全局的业务错误，自行处理
    skipHttpErrorHandler?: boolean // 是否跳过全局的http错误处理
    businessSuccessCodes?:string[]|number[]
    retDataField?:string
    retMsgField?:string
    retStatusField?:string
}
// http状态
enum HttpStatusCode {
    Ok = 200,
    Unauthorized = 401,// 没权限
    ConditionsChange = 412,// 条件改变
}
// 后台响应数据结构
interface ResponseData<T> {
    value: T  // 具体业务数据
    statusCode: string | number // 业务状态码
    message: string // 业务状态码，对应错误信息
}
// 业务错误对象
interface BusinessError extends AxiosError {
    isBusinessError: boolean
}


// 创建一个API的请求实例
const instance = axios.create(defaultRequestConfig);


// 对请求进行公共处理
(instance.interceptors.request as AxiosInterceptorManager<RequestConfig>).use((config) => {
     const token = app.getToken()
    if (token){
        config.headers!["Authorization"] = token;
    }
    // 配置token
    requestEmitter.emit('onStartRequest',{config:config}) 
    
    return config
}, (error) => {
    return Promise.reject(error)
});
// 对响应进行公共处理
instance.interceptors.response.use((response: AxiosResponse<ResponseData<any>>) => {
    // 针对业务错误处理

    const config= response.config as RequestConfig
    const code=response.data[config.retStatusField as keyof ResponseData<any>]
    const message=response.data[config.retMsgField as keyof ResponseData<any>]

    // 处理业务
    if (config.ignoreBusinessStatusCodeHandler||config.businessSuccessCodes!.some(bCode=>bCode===code)) {
        // 如果成功
        return response
    } else {
        const error = new AxiosError(message, code + '', response.config, response.request, response) as BusinessError
        error.isBusinessError = true
        return Promise.reject(error)
    }
}, (error:AxiosError) => {
    return Promise.reject(error)
})
instance.interceptors.response.use((response) => {
    const config= response.config as RequestConfig
    requestEmitter.emit('onCompleteRequest',{config}) 
    return response
}, (error: BusinessError) => {
    if(error.request){
        const config = error.config as RequestConfig
        requestEmitter.emit('onCompleteRequest',{config}) 
    }
    // 响应错误
    if (error.response) {
        const response = error.response as AxiosResponse<ResponseData<any>>
        const { skipHttpErrorHandler,skipBusinessErrorHandler ,retMsgField,retStatusField} = response.config as RequestConfig
        // 如果是业务错误，处理业务相关错误
        if (error.isBusinessError&&!skipBusinessErrorHandler) {
            const code=response.data[retStatusField as keyof ResponseData<any>]
            const message=response.data[retMsgField as keyof ResponseData<any>]
           // const data=response.data[retDataField as keyof ResponseData<any>]
            if(code===ResponseBusinessStatusCode.Unauthorized){
                // 如果没有权限需要重新登录
                app.clear().finally(()=>{
                    app.goLoginPage()
                })
                return Promise.reject(error)
            }
            Toast.show({
                icon: 'fail',
                content:message,
            })
        } else if(!error.isBusinessError&&!skipHttpErrorHandler){

            if(response.status === HttpStatusCode.Unauthorized) {
                // 没有权限需要重新登录
                app.clear().finally(()=>{
                    app.goLoginPage()
                })
                Toast.show({ icon: "fail", content: "请先登录!" });
            }
        }

    } else {
        if (error.code && error.code === "ECONNABORTED") {
            return Promise.reject(error);
          }
          if (error.code && error.code === "ERR_NETWORK") {
            Toast.show({ icon: "fail", content: '网络连接出现问题!' });
            return Promise.reject(error);
          }
        Toast.show({
            icon: 'fail',
            content:error.message,
        })
    }
    return Promise.reject(error)
})
/**
 * 发送get请求
 * @param url api请求路径
 * @param config axios请求配置
 * @returns 返回<T>数据
 */
const get = <T, D = any>(url: string, config?: RequestConfig<D>) => {
    return instance.get<ResponseData<T>>(url, config).then(res => res.data)
}
/** 
 * 发送post请求
 * @param url api请求路径
 * @param data post入参
 * @param config axios请求配置
 * @returns 返回<T>数据
 */
const post = <T, D = any>(url: string, data?: D, config?: RequestConfig<D>) => {
    return instance.post<ResponseData<T>>(url, data, config).then(res => res.data)
}

/** 
 * 发送put请求
 * @param url api请求路径
 * @param data put入参
 * @param config axios请求配置
 * @returns 返回<T>数据
 */
const put = <T, D = any>(url: string, data?: D, config?: RequestConfig<D>) => {
    return instance.put<ResponseData<T>>(url, data, config).then(res => res.data)
}
/** 
 * 发送delete请求
 * @param url api请求路径
 * @param config axios请求配置
 * @returns 返回<T>数据
 */
const deleteRequest = <T, D = any>(url: string, config?: RequestConfig<D>) => {
    return instance.delete<ResponseData<T>>(url, config).then(res => res.data)
}
/** 
 * 发送请求
 * @param config axios请求配置
 * @returns 返回<T>数据
 */
const request = <T, D = any>(config: RequestConfig<D>) => {
    return instance.request<ResponseData<T>>(config).then(res => res.data)
}
export default {
    get,
    post,
    put,
    delete: deleteRequest,
    request
}