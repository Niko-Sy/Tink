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
  server: {
    port: 11451, // 将端口号设置为 11451
    host: '0.0.0.0', // 可选：允许局域网访问
    open: true // 可选：启动后自动打开浏览器
  },
})
