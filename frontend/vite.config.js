import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    noDiscovery: true, // Do not scan files for dependencies
    include: [],       // Don't include anything for pre-bundling
  },
  server: {
    port: 5173,
    host: true,
    fs: {
      strict: false
    }
  }
})
