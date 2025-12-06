import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 React 相关库分离
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // 将 Ant Design 分离
          'antd-vendor': ['antd'],
          
          
          // 将其他大型库分离
          'utils-vendor': ['axios'],
        },
      },
    },
  },
  server: {
    port: 11451, // 将端口号设置为 11451
    host: '0.0.0.0', // 可选：允许局域网访问
    open: true // 可选：启动后自动打开浏览器
  },
})
