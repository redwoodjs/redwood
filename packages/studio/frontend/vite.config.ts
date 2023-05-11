import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../dist-frontend',
    chunkSizeWarningLimit: 1750,
  },
  server: {
    port: 4318,
  },
})
