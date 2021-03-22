import { defineConfig } from 'umi';
import routes from './routes';
import path from 'path';
import envConfig from './env';

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  envConfig: envConfig,
  dva: {
    immer: true,
  },
  forkTSChecker: {},
  routes: routes,
  fastRefresh: {},
  plugins: [path.resolve(__dirname, 'plugins', 'env.ts')],
});
