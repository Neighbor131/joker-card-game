import { defineConfig } from 'vite'
export default defineConfig({
  base: '/joker-card-game/',
  build: { sourcemap: true } // so errors point to TSX lines
})
