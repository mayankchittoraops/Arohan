import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// Deployed to GitHub Pages at https://<user>.github.io/arohan/
const base = process.env.VITE_BASE ?? '/arohan/'

export default defineConfig({
  base,
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: 'Arohan',
        short_name: 'Arohan',
        description:
          'A calm, offline-first companion for movement, mobility and steady progress.',
        theme_color: '#0b0b0f',
        background_color: '#0b0b0f',
        display: 'standalone',
        orientation: 'any',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  // Chunking is left to the bundler: forcing Chart.js into a named chunk makes
  // it a preloaded dependency of the entry, which defeats lazy-loading the one
  // route that uses it.
  build: {
    // One user, installed once, then served from cache. The entry carries the
    // whole exercise library on purpose so the app works offline immediately.
    chunkSizeWarningLimit: 700,
  },
})
