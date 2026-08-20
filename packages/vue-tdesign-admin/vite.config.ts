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
import vueDevtools from 'vite-plugin-vue-devtools'
import { TDesignResolver } from '@tdesign-vue-next/auto-import-resolver';
import { transform } from 'esbuild';
import type { Plugin } from 'vite';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const canvaskitDir = path.resolve(__dirname, 'lib/canvaskit/0.41.1');

const react19Dir = 'src/views/react/react19';

/**
 * 为自研 Mini React（react19）的 .tsx 演示文件提供独立 JSX 转换：
 * 项目全局 .tsx 由 vueJsx() 插件处理（Vue JSX），
 * 而 react19 目录下的 .tsx 需要切换到 react-jsx automatic 运行时（react19/jsx-runtime）。
 */
function react19JsxPlugin(): Plugin {
  return {
    name: 'react19-jsx-transform',
    enforce: 'pre',
    async transform(code, id) {
      if (id.includes(`/${react19Dir}/`) && id.endsWith('.tsx')) {
        const result = await transform(code, {
          loader: 'tsx',
          jsx: 'automatic',
          jsxImportSource: 'react19',
        });
        return { code: result.code, map: result.map };
      }
      return null;
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  resolve:{
    alias:{
      'src': path.resolve(__dirname, 'src'),
      '@': path.resolve(__dirname, 'src'),
      'zrender':path.resolve(__dirname, 'lib/zrender'),
      'lil-gui':path.resolve(__dirname, 'lib/lil-gui'),
      'canvaskit-wasm': canvaskitDir,
      'react19/jsx-runtime': path.resolve(__dirname, `${react19Dir}/lib/jsx-runtime.ts`),
      'react19': path.resolve(__dirname, `${react19Dir}/lib/index.ts`),
    },
    
  },
  build:{
    rollupOptions: {
      external: ['canvaskit-wasm'],
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
vue(), vueJsx(),react19JsxPlugin(),vueDevtools(),viteMockServe({
        mockPath: 'mock',
        enable: true,
      }),svgLoader(), tailwindcss(),    Components({
    resolvers: [TDesignResolver({library:'vue-next'})],
    dts:'src/components.d.ts',
  })],
 // assetsInclude: ['**/*.wasm'],
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
