import type { VercelRequest, VercelResponse } from '@vercel/node'

export async function proxyPagasa(
  req: VercelRequest,
  res: VercelResponse,
  path: string,
  search = '',
) {
  const base = process.env.BAGYO_PAGASA_API_URL
  if (!base) {
    res.status(503).json({
      error: { code: 'CONFIG', message: 'BAGYO_PAGASA_API_URL is not configured' },
    })
    return
  }

  const url = `${base.replace(/\/$/, '')}${path}${search}`
  try {
    const upstream = await fetch(url, { headers: { Accept: 'application/json' } })
    const body = await upstream.text()
    res.status(upstream.status).setHeader('Content-Type', 'application/json').send(body)
  } catch {
    res.status(502).json({ error: { code: 'UPSTREAM_ERROR', message: 'BagyoAPI unreachable' } })
  }
}

export async function proxyStorms(req: VercelRequest, res: VercelResponse) {
  const key = process.env.BAGYO_STORMS_API_KEY
  const base = (process.env.BAGYO_STORMS_API_URL || 'https://bagyo.io').replace(/\/$/, '')
  if (!key) {
    res.status(503).json({
      error: { code: 'STORMS_KEY_MISSING', message: 'Set BAGYO_STORMS_API_KEY for track data' },
    })
    return
  }

  try {
    const upstream = await fetch(`${base}/v1/storms`, {
      headers: { 'X-API-Key': key, Accept: 'application/json' },
    })
    const body = await upstream.text()
    res.status(upstream.status).setHeader('Content-Type', 'application/json').send(body)
  } catch {
    res.status(502).json({ error: { code: 'UPSTREAM_ERROR', message: 'Storms API unreachable' } })
  }
}
