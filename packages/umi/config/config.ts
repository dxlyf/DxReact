import { defineConfig } from 'umi';
import routes from './routes'
import path from 'path'
import envConfig from './env'
export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  envConfig:envConfig,
  define:{
     
  },
  theme:{
    'font-size-base': '14px',
    'badge-font-size': '12px',
    'btn-font-size-lg': '@font-size-base',
    'menu-dark-bg': '#fff',
    'menu-dark-submenu-bg': '#fff',
    'layout-sider-background': '#fff',
    'layout-body-background': '#f0f2f5',
  },
  dva:{
    immer:true
  },
  plugins:[path.resolve(__dirname,'plugins','env.ts')],
  forkTSChecker:{},
  routes:routes,
  fastRefresh: {},
});
