import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    // Allow access through public tunnels (e.g. Cloudflare quick tunnels) and
    // other local-network hosts during development/preview sharing.
    host: true,
    allowedHosts: ['.trycloudflare.com', '.loca.lt', '.ngrok-free.app', 'localhost'],
  },
  preview: {
    port: 4173,
    host: true,
    allowedHosts: ['.trycloudflare.com', '.loca.lt', '.ngrok-free.app', 'localhost'],
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor-react',
              test: /node_modules\/(react|react-dom|react-router|react-hook-form|zod|@hookform)\//,
            },
            {
              name: 'vendor-charts',
              test: /node_modules\/(recharts|victory-vendor|d3-[a-z0-9-]+)\//,
            },
            {
              name: 'vendor-ui',
              test: /node_modules\/(lucide-react)\//,
            },
          ],
        },
      },
    },
  },
})
