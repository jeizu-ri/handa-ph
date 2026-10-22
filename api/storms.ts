import type { VercelRequest, VercelResponse } from '@vercel/node'
import { proxyStorms } from './_lib/proxy'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'GET only' } })
    return
  }
  await proxyStorms(req, res)
}
