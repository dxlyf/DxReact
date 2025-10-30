import { defineConfig ,type PluginOption} from 'vite'
import react from '@vitejs/plugin-react-swc'
import UnoCSS from 'unocss/vite'
import {dirname,resolve,join} from 'node:path'
import {fileURLToPath} from 'node:url'
import { mockDevServerPlugin } from 'vite-plugin-mock-dev-server'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export function mockPlugin() {
  return {
    name: 'mock-plugin',
    configureServer(server) {
      server.middlewares.use('/api', (req, res, next) => {
        // 设置 CORS 头
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        //console.log('req',req.url)
        // 模拟路由
        if (req.url === '/upload' && req.method === 'POST') {
          res.end(JSON.stringify({
            code: 0,
            message: 'success',
            data: [
              { id: 1, name: 'Mock用户1' },
              { id: 2, name: 'Mock用户2' }
            ]
          }));
          return;
        }

        // 继续下一个中间件
        next();
      });
    }
  } as PluginOption;
}
// https://vite.dev/config/
export default defineConfig({
  plugins: [UnoCSS(),react(),mockPlugin(),false&&mockDevServerPlugin({
    bodyParserOptions:{},
    prefix: '^/api',
    dir:resolve(__dirname,'mock'),
    cors:true,
    log:'error'
  })].filter(Boolean),
  resolve:{
    alias:{
        src:resolve(__dirname,'src'),
        components:resolve(__dirname,'src/components'),
        store:resolve(__dirname,'src/store'),
    }
  },
  css:{
    modules:{
      
    }
  },
  server: {
    // proxy: {
    //   '^/api': 'http://example.com/',
    // },
  }
})


