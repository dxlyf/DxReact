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

  },
  dva:{
    immer:true
  },
  plugins:[path.resolve(__dirname,'plugins','env.ts')],
  forkTSChecker:{},
  routes:routes,
  fastRefresh: {},
});
