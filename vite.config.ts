import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['alert_digital.mp3', 'alert_chime.mp3', 'alert_bell.mp3', 'favicon.svg'],
      manifest: {
        name: 'Pomodoro Productivity PWA',
        short_name: 'Pomodoro PWA',
        description: 'A single-screen offline-first Pomodoro Productivity PWA with Dexie.js database',
        theme_color: '#212529',
        background_color: '#212529',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      }
    })
  ]
})
