import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  base: './',
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, 'dist/player-form'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        playerForm: resolve(__dirname, 'src/renderer/player-form.html')
      }
    }
  }
})

