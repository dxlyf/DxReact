export default {
  // 页面中通过 SYSTEM_API_ENV_NAME SYSTEM_API_ENV_VALUE
  env: {
    'mockApis': 'https://yapi.blissmall.net/mock/55',
    'devApis': 'https://retailadmin-dev.blissmall.net/apis',
    'devApis2': 'https://retailadmin-dev2.blissmall.net/apis',
    'devApis3': 'https://retailadmin-dev3.blissmall.net/apis',
    'devApis4': 'https://retailadmin-dev4.blissmall.net/apis',
    'qa001Apis': 'https://retailadmin-qa001.blissmall.net/apis',
    'qa002Apis': 'https://retailadmin-qa002.blissmall.net/apis',
    'qa003Apis': 'https://retailadmin-qa003.blissmall.net/apis',
    'utaApis': 'https://retailadmin-uat.blissmall.net/apis',
    'k8sApis': 'http://retailadmin-k8s.blissmall.net/apis',
    'apis': 'https://retailadmin.blissmall.net/apis'
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
