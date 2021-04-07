export default {
  // 页面中通过 SYSTEM_API_ENV_NAME SYSTEM_API_ENV_VALUE
  env: {

  },
  config(env: string, envValue: string) {
    return {
      proxy: {
        '/apis/': {
          target: envValue,
          changeOrigin: true,
          pathRewrite: { '^/apis': '' }
        },
      }
    };
  },
};
