import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import tailwindcss from '@tailwindcss/vite'
import svgLoader from 'vite-svg-loader';
import { viteMockServe } from 'vite-plugin-mock';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { TDesignResolver } from '@tdesign-vue-next/auto-import-resolver';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  resolve:{
    alias:{
      'src': path.resolve(__dirname, 'src'),
      '@': path.resolve(__dirname, 'src')
    }
  },
  css:{
    // preprocessorOptions:{
    //   less:{
    //     //  javascriptEnabled: true,
    //     //  modifyVars: {
    //     //   '@table-head-text-color': '#ff0000',
    //     // },
    //   }
    // }
  },
  plugins: [
vue(), vueJsx(),viteMockServe({
        mockPath: 'mock',
        enable: true,
      }),svgLoader(), tailwindcss(),    Components({
    resolvers: [TDesignResolver({library:'vue-next'})],
    dts:'src/components.d.ts',
  })],
  dev:{
    
  },
  // server:{
  //   proxy:{
  //     '/api':{
  //       target:'http://localhost:3000',
  //       changeOrigin:true,
  //       secure:false,
  //       rewrite:(path)=>path.replace(/^\/api/,'')
  //     }
  //   }
  // }
})
