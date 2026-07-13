import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['alert_digital.wav', 'alert_chime.wav', 'alert_bell.wav', 'favicon.svg'],
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
      },
      workbox: {
        // Precache all app assets including fonts and audio
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,wav}'],

        // Runtime cache: serve fonts from cache-first (handles query-string versioned font URLs)
        runtimeCaching: [
          {
            urlPattern: /\.(?:woff2?|eot|ttf|otf)(\?.*)?$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:wav|mp3|ogg)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ]
})
