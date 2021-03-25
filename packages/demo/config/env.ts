export default {
  // 页面中通过 SYSTEM_API_ENV_NAME SYSTEM_API_ENV_VALUE
  env: {
    
  },
  config(env: string, envValue: string) {
    return {
      define: {
        SYSTEM_API_ENV_NAME: env,
        SYSTEM_API_ENV_VALUE: envValue,
      },
      proxy: {
        '/api/': {
          target: envValue,
          changeOrigin: true,
          pathRewrite: { '^/api': '' },
          onProxyReq(proxyReq:any, req:any, res:any){
              console.log('proxy',req.url,proxyReq.path)
          }
        },
      },
    };
  },
};
