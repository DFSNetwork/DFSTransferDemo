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
      "_c": resolve(__dirname, "./src/components"),
      process: 'rollup-plugin-node-polyfills/polyfills/process-es6',
      buffer: 'rollup-plugin-node-polyfills/polyfills/buffer-es6',
      events: 'rollup-plugin-node-polyfills/polyfills/events',
      zlib: 'rollup-plugin-node-polyfills/polyfills/zlib',
      util: 'rollup-plugin-node-polyfills/polyfills/util',
      sys: 'util',
      stream: 'rollup-plugin-node-polyfills/polyfills/stream',
      _stream_duplex:
        'rollup-plugin-node-polyfills/polyfills/readable-stream/duplex',
      _stream_passthrough:
        'rollup-plugin-node-polyfills/polyfills/readable-stream/passthrough',
      _stream_readable:
        'rollup-plugin-node-polyfills/polyfills/readable-stream/readable',
      _stream_writable:
        'rollup-plugin-node-polyfills/polyfills/readable-stream/writable',
      _stream_transform:
        'rollup-plugin-node-polyfills/polyfills/readable-stream/transform',
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
