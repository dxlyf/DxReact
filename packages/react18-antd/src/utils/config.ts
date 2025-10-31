import type {ProxyOptions} from 'vite'
/*** 
 * 干净的配置，
 * 不包含任何额外的依赖
 * 用于Node.js环境和浏览器环境
*/


export enum APP_ENV{
    DEV='development', // 开发环境
    PROD='production' // 生产环境
}
export type IAppConfig={
    API_FILE_BASE_URL:string; // 文件上传基础路径
    API_BASE_URL:string; // API基础路径
   
    AXIOS_API_BASE_URL:string; // 用于axios请求代理
    AXIOS_API_FILE_BASE_URL:string// 用于axios请求代理
}

export type IAppEnvConfig={
    [Key in APP_ENV]:IAppConfig
}

export type IRequestProxyConfig={
        target:string, // 代理的目标地址
        changeOrigin?:boolean,
        rewrite?:(path:string)=>string
}
export type IEnvRequestProxyConfig={
    [Key in APP_ENV]:IRequestProxyConfig
}

// 用于vite端
export const createProxyDevServer=(mode:APP_ENV)=>{
    const config=APP_ENV_CONFIG[mode]
    return {
        '/api/':{
            target:config.API_BASE_URL,
            changeOrigin:true,
            rewrite:(path:string)=>path.replace(/^\/api/, '/api'),
            bypass:(req, res:Parameters<Required<ProxyOptions>['bypass']>[1], options: any)=> {
                const proxyURL = options.target + options.rewrite(req.url)
                res!.setHeader('x-req-proxyURL', proxyURL) // 设置响应头显示完整请求路径
   
            }
        },
        '/api_upload/':{
            target:config.API_FILE_BASE_URL,
            changeOrigin:true,
            rewrite:(path:string)=>path.replace(/^\/api_upload/, '/api'),
            bypass(req, res:Parameters<Required<ProxyOptions>['bypass']>[1], options: any) {
                const proxyURL = options.target + options.rewrite(req.url)
                res!.setHeader('x-req-proxyURL', proxyURL) // 设置响应头显示完整请求路径
            }
        }
    } as Record<string,ProxyOptions|string>
}

// 环境配置信息
export const APP_ENV_CONFIG:IAppEnvConfig={
    [APP_ENV.DEV]:{
        API_BASE_URL:'http://172.17.0.100:3001', 
        API_FILE_BASE_URL:'http://172.17.0.100:5000',
        AXIOS_API_BASE_URL:'/api',
        AXIOS_API_FILE_BASE_URL:'/api_upload'
    },
    [APP_ENV.PROD]:{
        API_BASE_URL:'http://172.17.0.100:3001', 
        API_FILE_BASE_URL:'http://172.17.0.100:5000',

        AXIOS_API_BASE_URL:'http://172.17.0.100:3001/api',
        AXIOS_API_FILE_BASE_URL:'http://172.17.0.100:5000/api'
    }
}
