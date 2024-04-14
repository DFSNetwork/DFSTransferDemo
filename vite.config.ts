import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 8080,
  },
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router'],
      dts: "src/auto-import.d.ts",
      resolvers: [VantResolver()],
    }),
    Components({
      dts: "src/components.d.ts",
      resolvers: [VantResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve('src'),
      "_c": resolve(__dirname, "./src/components")
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@import "@/assets/common.scss";',
      }
    }
  }
})
