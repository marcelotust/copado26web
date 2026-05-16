import { existsSync, readdirSync, rmSync, statSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
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

function removeMapFiles(dir) {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      removeMapFiles(fullPath)
    } else if (entry.endsWith('.map')) {
      rmSync(fullPath)
    }
  }
}

function removePublicSourceMapsPlugin() {
  let root = process.cwd()
  let outDir = 'dist'

  return {
    name: 'remove-public-source-maps',
    apply: 'build',
    configResolved(config) {
      root = config.root
      outDir = config.build.outDir
    },
    closeBundle() {
      removeMapFiles(isAbsolute(outDir) ? outDir : join(root, outDir))
    },
  }
}

export default defineConfig({
  // Defense in depth: keep the dev server loopback-only even after the Vite 8 upgrade.
  server: { host: '127.0.0.1' },
  build: {
    // 'hidden' emits .map files (so the Sentry plugin can upload them for
    // symbolication) but omits the //# sourceMappingURL= comment from the
    // bundles, so browsers won't fetch them and they don't reconstruct
    // TS source for anyone who hits the asset URLs directly.
    sourcemap: 'hidden',
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192.png', 'pwa-512.png', 'apple-touch-icon.png', 'og-image.png'],
      manifest: {
        name: 'Meu Album 2026',
        short_name: 'MeuAlbum',
        description: 'Seu álbum digital de figurinhas da Copa do Mundo 2026',
        lang: 'pt-BR',
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
        sourcemap: false,
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
    removePublicSourceMapsPlugin(),
  ],
})
