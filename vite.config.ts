import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  envDir: './', // 环境变量目录，默认为项目根目录
  publicDir: 'public',
  build: {
    assetsDir: 'assets',
  },
  server: {
    host: '0.0.0.0',
    port: 3345
  },
  preview: {
    host: '0.0.0.0',
    port: 3345 // 指定预览模式的端口
  },
  optimizeDeps: {
    exclude: ['d3', 'd3-cloud']
  }
})
