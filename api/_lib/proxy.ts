import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  bagyoRequestHeaders,
  getBagyoApiKey,
  getPagasaApiBase,
  missingBagyoKeyResponse,
} from './bagyo.js'
import {
  getPagasaSnapshot,
  snapshotToCyclonesActive,
  snapshotToLookupResponse,
  snapshotToSignalsCurrent,
} from './pagasa-scrape.js'

async function proxyPagasaUpstream(
  res: VercelResponse,
  path: string,
  search: string,
): Promise<boolean> {
  const url = `${getPagasaApiBase()}${path}${search}`
  const upstream = await fetch(url, { headers: bagyoRequestHeaders() })
  const body = await upstream.text()
  res.status(upstream.status).setHeader('Content-Type', 'application/json').send(body)
  return true
}

async function pagasaScrapeFallback(
  res: VercelResponse,
  path: string,
  search: string,
): Promise<void> {
  try {
    const snapshot = await getPagasaSnapshot()
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')

    if (path === '/v1/signals/lookup') {
      const q = new URLSearchParams(search.replace(/^\?/, '')).get('q') ?? ''
      res.status(200).json(snapshotToLookupResponse(snapshot, q))
      return
    }
    if (path === '/v1/signals/current') {
      res.status(200).json(snapshotToSignalsCurrent(snapshot))
      return
    }
    if (path === '/v1/cyclones/active') {
      res.status(200).json(snapshotToCyclonesActive(snapshot))
      return
    }

    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Unknown route' } })
  } catch {
    res.status(503).json({
      error: {
        code: 'PAGASA_UNAVAILABLE',
        message:
          'Could not read PAGASA bulletins right now. Try again later or open the official PAGASA bulletin page.',
      },
    })
  }
}

export async function proxyPagasa(
  _req: VercelRequest,
  res: VercelResponse,
  path: string,
  search = '',
) {
  if (getBagyoApiKey()) {
    try {
      await proxyPagasaUpstream(res, path, search)
    } catch {
      res.status(502).json({ error: { code: 'UPSTREAM_ERROR', message: 'Weather API unreachable' } })
    }
    return
  }

  await pagasaScrapeFallback(res, path, search)
}

export async function proxyStorms(_req: VercelRequest, res: VercelResponse) {
  const key = getBagyoApiKey()
  const base = (process.env.BAGYO_STORMS_API_URL || 'https://bagyo.io').replace(/\/$/, '')
  if (!key) {
    res.status(503).json({
      ...missingBagyoKeyResponse(),
      hint: 'Map tracks need BAGYO_API_KEY. Signals and cyclones work without a key via PAGASA scrape.',
    })
    return
  }

  try {
    const upstream = await fetch(`${base}/v1/storms`, {
      headers: bagyoRequestHeaders(),
    })
    const body = await upstream.text()
    res.status(upstream.status).setHeader('Content-Type', 'application/json').send(body)
  } catch {
    res.status(502).json({ error: { code: 'UPSTREAM_ERROR', message: 'Storms API unreachable' } })
  }
}
