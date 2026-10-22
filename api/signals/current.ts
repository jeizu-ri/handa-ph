import type { VercelRequest, VercelResponse } from '@vercel/node'
import { proxyPagasa } from '../_lib/proxy.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'GET only' } })
    return
  }
  await proxyPagasa(req, res, '/v1/signals/current')
}
