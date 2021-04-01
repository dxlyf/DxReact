export default {
  // 页面中通过 SYSTEM_API_ENV_NAME SYSTEM_API_ENV_VALUE
  env: {
    apis: atob("aHR0cHM6Ly9yZXRhaWxhZG1pbi5ibGlzc21hbGwubmV0L2FwaXM="),
    devApis: atob("aHR0cHM6Ly9yZXRhaWxhZG1pbi1kZXYuYmxpc3NtYWxsLm5ldC9hcGlz"),
    devApis2: atob("aHR0cHM6Ly9yZXRhaWxhZG1pbi1kZXYyLmJsaXNzbWFsbC5uZXQvYXBpcw=="),
    devApis3: atob("aHR0cHM6Ly9yZXRhaWxhZG1pbi1kZXYzLmJsaXNzbWFsbC5uZXQvYXBpcw=="),
    devApis4: atob("aHR0cHM6Ly9yZXRhaWxhZG1pbi1kZXY0LmJsaXNzbWFsbC5uZXQvYXBpcw=="),
    k8sApis: atob("aHR0cDovL3JldGFpbGFkbWluLWs4cy5ibGlzc21hbGwubmV0L2FwaXM="),
    mockApis: atob("aHR0cHM6Ly95YXBpLmJsaXNzbWFsbC5uZXQvbW9jay81NQ=="),
    qa001Apis: atob("aHR0cHM6Ly9yZXRhaWxhZG1pbi1xYTAwMS5ibGlzc21hbGwubmV0L2FwaXM="),
    qa002Apis: atob("aHR0cHM6Ly9yZXRhaWxhZG1pbi1xYTAwMi5ibGlzc21hbGwubmV0L2FwaXM="),
    qa003Apis: atob("aHR0cHM6Ly9yZXRhaWxhZG1pbi1xYTAwMy5ibGlzc21hbGwubmV0L2FwaXM="),
    utaApis: atob("aHR0cHM6Ly9yZXRhaWxhZG1pbi11YXQuYmxpc3NtYWxsLm5ldC9hcGlz"),
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
          pathRewrite: { '^/api': '' }
        },
      },
    };
  },
};
