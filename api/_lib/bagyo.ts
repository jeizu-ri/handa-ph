export function getPagasaApiBase(): string {
  return (process.env.BAGYO_PAGASA_API_URL || 'https://bagyo.io').replace(/\/$/, '')
}

export function getBagyoApiKey(): string | undefined {
  return process.env.BAGYO_API_KEY || process.env.BAGYO_STORMS_API_KEY || undefined
}

export function bagyoRequestHeaders(): HeadersInit {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const key = getBagyoApiKey()
  if (key) headers['X-API-Key'] = key
  return headers
}

export function missingBagyoKeyResponse() {
  return {
    error: {
      code: 'API_KEY_MISSING',
      message:
        'Weather data needs a free API key. Add BAGYO_API_KEY in Vercel (get one at https://bagyo.io/developers).',
    },
  }
}
