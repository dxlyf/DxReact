export default {
  // 页面中通过 SYSTEM_API_ENV_NAME SYSTEM_API_ENV_VALUE
  env: {
    mockApis: 'https://yapi..net/mock/55',
    devApis: 'https://-dev..net/apis',
    devApis2: 'https://-dev2..net/apis',
    devApis3: 'https://-dev3..net/apis',
    devApis4: 'https://-dev4..net/apis',
    qa001Apis: 'https://-qa001..net/apis',
    qa002Apis: 'https://-qa002..net/apis',
    qa003Apis: 'https://-qa003..net/apis',
    utaApis: 'https://-uat..net/apis',
    k8sApis: 'http://-k8s..net/apis',
    apis: 'https://..net/apis',
  },
  config(env: string, envValue: string) {
    return {
      proxy: {
        '/apis/': {
          target: envValue,
          changeOrigin: true,
          pathRewrite: { '^/apis': '' },
        },
      },
    };
  },
};
