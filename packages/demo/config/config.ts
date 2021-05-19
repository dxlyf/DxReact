import { defineConfig } from 'umi';
import routes from './routes';
import path from 'path';

export default defineConfig({
  title: false,
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
  forkTSChecker: {},
  routes: routes,
  fastRefresh: {},
  plugins: [path.resolve(__dirname, 'plugins', 'env.ts')],
});
