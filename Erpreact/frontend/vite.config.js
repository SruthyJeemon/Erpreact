import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    preserveSymlinks: true
  },
  server: {
    watch: {
      usePolling: true,
      interval: 100
    },
    proxy: {

      '/api': {
        target: 'http://localhost:5023',
        changeOrigin: true,
        secure: false
      },
      '/Content': {
        target: 'http://localhost:5023',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: 'http://localhost:5023',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
