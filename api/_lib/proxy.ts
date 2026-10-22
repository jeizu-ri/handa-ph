import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  bagyoRequestHeaders,
  getBagyoApiKey,
  getPagasaApiBase,
  missingBagyoKeyResponse,
} from './bagyo.js'

export async function proxyPagasa(
  _req: VercelRequest,
  res: VercelResponse,
  path: string,
  search = '',
) {
  if (!getBagyoApiKey()) {
    res.status(503).json(missingBagyoKeyResponse())
    return
  }

  const url = `${getPagasaApiBase()}${path}${search}`
  try {
    const upstream = await fetch(url, { headers: bagyoRequestHeaders() })
    const body = await upstream.text()
    res.status(upstream.status).setHeader('Content-Type', 'application/json').send(body)
  } catch {
    res.status(502).json({ error: { code: 'UPSTREAM_ERROR', message: 'Weather API unreachable' } })
  }
}

export async function proxyStorms(_req: VercelRequest, res: VercelResponse) {
  const key = getBagyoApiKey()
  const base = (process.env.BAGYO_STORMS_API_URL || 'https://bagyo.io').replace(/\/$/, '')
  if (!key) {
    res.status(503).json(missingBagyoKeyResponse())
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
