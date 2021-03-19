export default {
    // 页面中通过 SYSTEM_API_ENV_NAME SYSTEM_API_ENV_VALUE
    env:{
      dev:"api1",
      prod:"api2"
    },
    config(env:string,envValue:string){
       return {
          define:{
            SYSTEM_API_ENV_NAME:env,
            SYSTEM_API_ENV_VALUE:envValue
          },
          proxy:{
            '/api/': {
                target: envValue,
                changeOrigin: true,
                pathRewrite: { '^api': '' },
              }
          }
       }
    }
}