import type { VercelRequest, VercelResponse } from '@vercel/node'
import { reversePhLocation } from '../_lib/nominatim.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'GET only' } })
    return
  }

  const lat = Number(req.query.lat)
  const lon = Number(req.query.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    res.status(400).json({ error: { code: 'INVALID', message: 'lat and lon required' } })
    return
  }

  try {
    const data = await reversePhLocation(lat, lon)
    res.status(200).json({ data })
  } catch {
    res.status(502).json({ error: { code: 'UPSTREAM_ERROR', message: 'Reverse geocode failed' } })
  }
}
