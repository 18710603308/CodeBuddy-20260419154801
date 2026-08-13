import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import wasm from "vite-plugin-wasm"

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), wasm()],
  // PGlite (PostgreSQL WASM) 依赖的 .wasm/.data 文件需按静态资源处理
  assetsInclude: ['**/*.wasm', '**/*.data'],
  optimizeDeps: {
    exclude: ['@electric-sql/pglite'],
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      // Poker WebSocket (必须在 generic /api 之前)
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
      // Poker API 专用路由
      '/api/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/user': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/health': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // Poker Next.js 前端
      '/poker': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // GaussDB 学习 - SQL 验证 API（生产走 nginx /sql-api/，本地开发代理到服务器）
      '/sql-api': {
        target: 'https://110.42.247.238',
        changeOrigin: true,
        secure: false,
      },
      // 通用 API（Docker API 等）
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // 音乐 API 代理（解决 CORS）
      '/music-api/netease': {
        target: 'https://music.163.com',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/music-api\/netease/, ''),
      },
      '/music-api/qq': {
        target: 'https://c.y.qq.com',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/music-api\/qq/, ''),
      },
      '/music-api/kugou': {
        target: 'https://mobilecdn.kugou.com',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/music-api\/kugou/, ''),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});
