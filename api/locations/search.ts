import type { VercelRequest, VercelResponse } from '@vercel/node'
import { searchPhLocations } from '../_lib/nominatim.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'GET only' } })
    return
  }

  const q = typeof req.query.q === 'string' ? req.query.q : ''
  try {
    const data = await searchPhLocations(q)
    res.setHeader('Cache-Control', 'public, s-maxage=3600')
    res.status(200).json({ data })
  } catch {
    res.status(502).json({ error: { code: 'UPSTREAM_ERROR', message: 'Location search unavailable' } })
  }
}
