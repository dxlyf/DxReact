import { defineConfig } from 'umi';
import envConfig from './env';
import path from 'path'
export default defineConfig({
  mock: {},
  plugins: [
    'react-dev-inspector/plugins/umi/react-inspector',
    path.resolve(__dirname, 'plugins', 'env.ts')],
  inspectorConfig: {
    exclude: [],
    babelPlugins: [],
    babelOptions: {},
  },
  envConfig: envConfig,
  
});
