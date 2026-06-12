import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' keeps asset URLs relative so the built site (and the Playwright
// PDF render) work when opened offline / served from any path.
export default defineConfig({
  plugins: [react()],
  base: './',
})
