import { defineConfig } from 'vite'
export default defineConfig({
  base: '/joker-card-game/',
  build: { sourcemap: true } // readable stack traces if anything still explodes
})
