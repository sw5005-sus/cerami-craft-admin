/**
 * @file Vite 构建配置文件
 * @description 配置 Vite 开发服务器和构建选项
 */

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()], // 启用 Vue 3 支持
  // 构建配置 - 生产环境自动移除 console.log
  esbuild: {
    drop: ['console', 'debugger'], // 生产环境移除 console 和 debugger
  },
  server: {
    port: 5173, // Port for `vite dev`
    host: '0.0.0.0', // Listen on all network interfaces
    allowedHosts: true, // 允许所有主机访问
    proxy: {
      // 匹配所有以 /api 开头的请求，统一代理到后端
      '/api': {
        target: 'https://ceramicraft-merchant-frontend',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '') // 将 /api/user-ms/... 重写为 /user-ms/...
      }
    }
  },
  preview: {
    port: 4173, // Port for `vite preview`
    host: '0.0.0.0', // Listen on all network interfaces
    allowedHosts: true // 允许所有主机访问
  },
})
