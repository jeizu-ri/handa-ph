import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  getPagasaSnapshot,
  snapshotToCyclonesActive,
  snapshotToLookupResponse,
  snapshotToSignalsCurrent,
  snapshotToStormTracks,
} from './api/_lib/pagasa-scrape.js'

function apiDevPlugin(env: Record<string, string>): Plugin {
  const pagasaBase = (env.BAGYO_PAGASA_API_URL || 'https://bagyo.io').replace(/\/$/, '')
  const apiKey = env.BAGYO_API_KEY || env.BAGYO_STORMS_API_KEY || ''
  const stormsBase = (env.BAGYO_STORMS_API_URL || 'https://bagyo.io').replace(/\/$/, '')

  async function scrapePagasa(path: string, res: ServerResponse, search = '') {
    try {
      const snapshot = await getPagasaSnapshot()
      let payload: unknown
      if (path === '/v1/signals/lookup') {
        const q = new URLSearchParams(search.replace(/^\?/, '')).get('q') ?? ''
        payload = snapshotToLookupResponse(snapshot, q)
      } else if (path === '/v1/signals/current') {
        payload = snapshotToSignalsCurrent(snapshot)
      } else if (path === '/v1/cyclones/active') {
        payload = snapshotToCyclonesActive(snapshot)
      } else {
        res.statusCode = 404
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Unknown route' } }))
        return
      }
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(payload))
    } catch {
      res.statusCode = 503
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          error: {
            code: 'PAGASA_UNAVAILABLE',
            message: 'Could not read PAGASA bulletins right now.',
          },
        }),
      )
    }
  }

  async function proxyPagasa(path: string, res: ServerResponse, search = '') {
    if (!apiKey) {
      await scrapePagasa(path, res, search)
      return
    }
    const url = `${pagasaBase}${path}${search}`
    try {
      const upstream = await fetch(url, {
        headers: { Accept: 'application/json', 'X-API-Key': apiKey },
      })
      const body = await upstream.text()
      res.statusCode = upstream.status
      res.setHeader('Content-Type', 'application/json')
      res.end(body)
    } catch {
      res.statusCode = 502
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: { code: 'UPSTREAM_ERROR', message: 'BagyoAPI unreachable' } }))
    }
  }

  return {
    name: 'handa-api-dev',
    configureServer(server) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next) => {
        const rawUrl = req.url ?? ''
        if (!rawUrl.startsWith('/api/')) {
          next()
          return
        }

        void (async () => {
          const url = new URL(rawUrl, 'http://localhost')
          const pathname = url.pathname

          if (pathname === '/api/cyclones/active') {
            await proxyPagasa('/v1/cyclones/active', res)
            return
          }
          if (pathname === '/api/signals/current') {
            await proxyPagasa('/v1/signals/current', res)
            return
          }
          if (pathname === '/api/signals/lookup') {
            const q = url.searchParams.get('q') ?? ''
            await proxyPagasa('/v1/signals/lookup', res, `?q=${encodeURIComponent(q)}`)
            return
          }
          if (pathname === '/api/storms') {
            if (!apiKey) {
              try {
                const snapshot = await getPagasaSnapshot()
                const payload = snapshotToStormTracks(snapshot)
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify(payload))
              } catch {
                res.statusCode = 503
                res.setHeader('Content-Type', 'application/json')
                res.end(
                  JSON.stringify({
                    error: { code: 'PAGASA_UNAVAILABLE', message: 'Could not load storm track from PAGASA.' },
                  }),
                )
              }
              return
            }
            try {
              const upstream = await fetch(`${stormsBase}/v1/storms`, {
                headers: { 'X-API-Key': apiKey, Accept: 'application/json' },
              })
              const body = await upstream.text()
              res.statusCode = upstream.status
              res.setHeader('Content-Type', 'application/json')
              res.end(body)
            } catch {
              res.statusCode = 502
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: { code: 'UPSTREAM_ERROR', message: 'Storms API unreachable' } }))
            }
            return
          }

          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Unknown API route' } }))
        })()
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      tailwindcss(),
      apiDevPlugin(env),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg'],
        manifest: {
          name: 'Handa PH — Typhoon Alerts',
          short_name: 'Handa PH',
          description: 'Philippines typhoon and wind signal alerts (unofficial mirror — confirm with PAGASA)',
          theme_color: '#0c4a6e',
          background_color: '#0f172a',
          display: 'standalone',
          start_url: '/',
          icons: [
            { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
            { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^\/api\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'handa-api-cache',
                networkTimeoutSeconds: 10,
                expiration: { maxEntries: 32, maxAgeSeconds: 60 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
  }
})
