import { defineConfig } from 'umi';
import routes from './routes';
import dumiConfig from './dumi.config'
export default defineConfig({
  outputPath: 'build',
  nodeModulesTransform: {
    type: 'none',
  },
  define: {
    SYSTEM_REQUEST_PREFIX: '/apis/',
  },
  dva: {
    immer: true,
  },
  dynamicImport: {
    loading: '@ant-design/pro-layout/es/PageLoading',
  },
  esbuild: {},
  title: false,
  ignoreMomentLocale: true,
  manifest: {
    basePath: '/',
  },
  request:false,
  hash: true,
  forkTSChecker: {},
  routes: routes,
  fastRefresh: {},
  links:[{
      rel:"shortcut icon",
      type:"image/png",
      href:"https://rf.blissmall.net/static/weixin_share_logo.png"
  }],
   // mfsu:{} 不开启，当前umi版本msfu待优化
  // dumi
  ...dumiConfig
});
