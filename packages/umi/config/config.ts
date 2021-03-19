import { defineConfig } from 'umi';
import routes from './routes'
export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  define:{
     LOGIN_PAGE_ROUTE:"/login"
  },
  dva:{
    immer:true
  },
  forkTSChecker:{},
  routes:routes,
  fastRefresh: {},
});
