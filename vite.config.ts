import { defineConfig } from 'vite'

export default defineConfig({
  // must match your repo name exactly
  base: '/joker-card-game/',
  server: { port: 5173, open: true }, // harmless locally
})
