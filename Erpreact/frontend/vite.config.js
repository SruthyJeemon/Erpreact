import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    preserveSymlinks: true
  },
  server: {
    // Listen on all interfaces so other devices can use http://<your-LAN-IP>:5173
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
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
