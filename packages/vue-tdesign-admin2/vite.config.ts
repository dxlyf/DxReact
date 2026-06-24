import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite';
import { TDesignResolver } from '@tdesign-vue-next/auto-import-resolver';
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { viteMockServe } from 'vite-plugin-mock'
import VueRouter from 'vue-router/vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(({ command }) => {
  const plugins: any[] = [
    VueRouter({
      /* options */
    }),
    vue(),
    vueJsx(),
    AutoImport({
      resolvers: [TDesignResolver({
        library: 'vue-next'
      })],
      imports: ['vue', 'vue-router', 'pinia'],
      dts: 'src/auto-imports.d.ts',
    }),
    Components({
    //  dirs: ['src/pages','src/components'],
      resolvers: [TDesignResolver({
        library:'vue-next'  
      })],
      dts: 'src/components.d.ts',
    }),
  ]

  if (command === 'serve') {

    plugins.push(
      viteMockServe({
        mockPath: 'mock',
        enable: true,
      }),
    )
  }

  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    plugins,
  }
})
