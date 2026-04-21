import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Jalol KFC',
        short_name: 'KFC',
        description: 'Jalol KFC POS System',
        theme_color: '#EF4444',
        icons: [
          {
            src: '/chicken.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/chicken.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
