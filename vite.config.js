import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { sentryVitePlugin } from '@sentry/vite-plugin'

const release =
  process.env.VERCEL_GIT_COMMIT_SHA
  ?? process.env.VITE_SENTRY_RELEASE
  ?? 'local-dev'

const sentryPlugin =
  process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
    ? sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        release: { name: release },
        sourcemaps: { filesToDeleteAfterUpload: ['**/*.map'] },
      })
    : null

export default defineConfig({
  // Bind dev server to localhost explicitly — prevents GHSA-67mh-4wv8-2f99 (esbuild SSRF).
  // Vite 5.x cannot be upgraded to a fixed esbuild without a major version bump; mitigation
  // is to never expose the dev server to the network (no --host flag in CI or local scripts).
  server: { host: '127.0.0.1' },
  build: {
    sourcemap: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        name: 'Meu Album 2026',
        short_name: 'MeuAlbum',
        description: 'Seu álbum digital de figurinhas da Copa do Mundo 2026',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // StaleWhileRevalidate (was CacheFirst) — supply chain: revalida contra CDN
            // a cada request em vez de servir silenciosamente por 30 dias (#52)
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'cdn-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
    ...(sentryPlugin ? [sentryPlugin] : []),
  ],
})
