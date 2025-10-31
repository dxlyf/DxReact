/***
 * 当前h5应用,全局状态和应用本地数据管理
 */
import  {type To,type RouterNavigateOptions,createBrowserRouter} from 'react-router-dom'
import localforage from 'localforage'
import Cookies from 'js-cookie'
// import { ILoginResult } from '@/types/api/login'
import mitt,{type Emitter} from 'mitt'
import {type IAppConfig,APP_ENV_CONFIG,APP_ENV} from './config'
type ILoginResult=any
/**
 * 本地存储管理类,用于管理应用本地数据,支持持久化存储和读取等操作。
 * @class LocalStore
 */
class LocalStore{
    private storageKey:string
    data:Record<string,any>={}
    constructor(storageKey:string){
        this.storageKey=storageKey
    }
    // 读取本地数据
    async read(){
        try{
            let data=await localforage.getItem(this.storageKey)
            let jsonData= JSON.parse(data as any)
            if(jsonData){
                this.data=jsonData
            }
            return true
         }catch(e){
            this.data={}
         }
         return false
    }
    async write(){
        try{
           await localforage.setItem(this.storageKey,JSON.stringify(this.data))
           return true
        }catch(e){}
        return false
    }
    assign(object:any){
        Object.assign(this.data,object)
        return this.write()
    }
    set(name:string,value:any){
       this.data[name]=value
       return this.write()
    }
    remove(name:string){
        delete this.data[name]
        return this.write()
    }
    get(name:string){
        return this.data[name]
    }
}
/**
 * App 应用状态管理
 */
type AppEvents={
    onClear:App // app 清除事件
    onUpdateComponent:App // 更新组件事件

}
/**
 * 路径规范化处理
 * @param base 基础路径
 * @param url 路径,可以是相对路径或绝对路径
 * @returns 
 */
function normalizeHttpPath(base:string,url:string){
    if(url.startsWith('http')){
        return url
    }else if(base.endsWith('/')&&url.startsWith('/')){
        return `${base}${url.slice(1)}`
    }else if(base.endsWith('/')||url.startsWith('/')){
        return `${base}${url}`
    }
    return `${base}/${url}`
}
class App{
    tokenRefreshIntervalTime:number=5*60*1000 // 5分钟
    router!:ReturnType<typeof createBrowserRouter>
    localStore=new LocalStore('APP_LOCAL_STORAGE')
    event:Emitter<AppEvents>=mitt()
    config:IAppConfig=APP_ENV_CONFIG[import.meta.env.MODE as APP_ENV]
    constructor(){
        
    }

    // 返回图片完整地址
    toImageUrl(url:string){
        return normalizeHttpPath(this.config.API_FILE_BASE_URL,url)
    }
    setRouter(router:any){
        this.router=router
    }
    async initialize(){
         await this.localStore.read()
        // this.checkTokenExpiration()// 检查token是否过期,如果过期则清除用户登录信息

    }
    // 触发更新组件事件
    forceUpdate(){
        this.event.emit('onUpdateComponent',this)
    }
    // 获取token过期时间

    getTokenExpiration(){
        const value=parseInt(localStorage.getItem('APP_TOKEN_EXPIRATION') as string)
        return Number.isNaN(value)?-1:value
    }
    setTokenExpiration(expiration:number|string){
        localStorage.setItem('APP_TOKEN_EXPIRATION',expiration+'')
    }
    removeTokenExpiration(){
        localStorage.removeItem('APP_TOKEN_EXPIRATION')
    }
    saveUserLoginInfo(userLoginInfo:ILoginResult){
        return this.localStore.set('userLoginInfo',userLoginInfo).then(()=>{
            this.setTokenExpiration(Date.now()+userLoginInfo.token.expiration)
            this.startTokenRefresh() // 开启token刷新定时器
        })
    }
    getUserLoginInfo(){
        return this.localStore.get('userLoginInfo') as ILoginResult
    }
    removeUserLoginInfo(){
       return this.localStore.remove('userLoginInfo')
    }
    // 设置token信息，用于请求API
    setToken(tokenType:string,authToken:string,expires:number){
        Cookies.set("user_token",`${tokenType} ${authToken}`,{expires:expires});
    }
    setFileServiceToken(token:string){
        localStorage.setItem('APP_FILE_UPLOAD_TOKEN',token)
    }
    // 文件服务器token
    getFileServiceToken(){
        return localStorage.getItem('APP_FILE_UPLOAD_TOKEN')
    }
    removeFileServiceToken(){
        localStorage.removeItem('APP_FILE_UPLOAD_TOKEN')
    }
    /**
     * 获取登录token信息
     */
    getToken(){
         return Cookies.get('user_token')
    }
    // 移动
    removeToken(){
        Cookies.remove('user_token')
    }
    // 跳转到登录页面
    goLoginPage(){
      //  this.navigate('/login')
    }
    navigate(to: To | null, opts?: RouterNavigateOptions){
       return this.router.navigate(to,opts)
    }
    async clear(){
        // 清除本地存储数据
        // this.removeToken() // 清除API token信息
        // this.removeFileServiceToken() // 清除文件上传token信息
        // this.stopTokenRefresh() // 停止token刷新定时器
        // this.removeTokenExpiration() // 清除token过期时间信息
        // await this.removeUserLoginInfo() // 清除用户登录信息
        // this.forceUpdate() // 更新组件状态
    }
    /**
     * 检查expiration时间，如果过期则清除本地存储数据并更新组件状态
     */
    checkTokenExpiration=()=>{
        const expiration=this.getTokenExpiration()
        const userInfo=this.getUserLoginInfo()
        if(!userInfo){
            return
        }
        if(expiration===-1||Date.now()>expiration){
            // 清除本地存储数据
            this.clear()
            this.goLoginPage()
        }else{
            this.startTokenRefresh()
        }
    }
    startTokenRefresh(){
        Timer.getInstance(this.tokenRefreshIntervalTime,this.checkTokenExpiration).start()
    }
    stopTokenRefresh(){
        Timer.instance?.stop()
    }
}
/**
 * 简单的定时器类，用于定时执行任务。

 */
class Timer{
    static instance:Timer|null=null
    static getInstance(intervalSecond:number,onTask:()=>void){
        if(this.instance){
            this.instance.stop()
            this.instance=null
        }
        this.instance= new Timer(intervalSecond,onTask)
        return this.instance
    }
    timeId:any=-1
    constructor(private intervalSecond:number,private onTask:()=>void){
    }
    start(){
        this.stop()
        const handleTimer=()=>{
                this.onTask()
                this.timeId=setTimeout(handleTimer,this.intervalSecond)
        }
        this.timeId=setTimeout(handleTimer,this.intervalSecond)
         return this
    }
  
    stop(){
        if(this.timeId>-1){
            clearTimeout(this.timeId)  
            this.timeId=-1         
        }  
        return this
    }
}


export default new App()
