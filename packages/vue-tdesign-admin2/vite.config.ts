import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import AutoImport from 'unplugin-auto-import/vite'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
 import { viteMockServe } from 'vite-plugin-mock'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(({ command }) => {
  const plugins: any[] = [
    vue(),
    vueJsx(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      dts: 'src/auto-imports.d.ts',
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
