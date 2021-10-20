import { defineConfig } from 'umi';
import envConfig from './env';
import path from 'path'
export default defineConfig({
  mock: {},
  plugins: [
    'react-dev-inspector/plugins/umi/react-inspector',
    path.join(__dirname,'plugins/env.ts'),
    path.join(__dirname,'plugins/generate.ts')],
  inspectorConfig: {
    exclude: [],
    babelPlugins: [],
    babelOptions: {},
  },
  envConfig: envConfig,
  
});
