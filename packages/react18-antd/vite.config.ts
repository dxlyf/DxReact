import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import UnoCSS from 'unocss/vite'
import {dirname,resolve,join} from 'node:path'
import {fileURLToPath} from 'node:url'
import { mockDevServerPlugin } from 'vite-plugin-mock-dev-server'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [UnoCSS(),react(),mockDevServerPlugin({
    bodyParserOptions:{},
    prefix: '^/api',
    dir:resolve(__dirname,'mock'),
    cors:true,
    log:'error'
  })],
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
    proxy: {
      '^/api': 'http://example.com/',
    },
  }
})


