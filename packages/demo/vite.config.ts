import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {fileURLToPath} from 'node:url'
import path from 'path'
const  __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)
// https://vite.dev/config/
export default defineConfig({
  resolve:{
     alias:{
        src:path.resolve(__dirname,'src'),
        'react':path.resolve(__dirname,'src/react/index.ts')
     }
  },
  oxc:{
    jsxInject:`import { h } from 'src/react'`,
  },
  plugins: [react({
      jsxRuntime:'classic',
  })],
})
