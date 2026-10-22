import type {
  ApiError,
  CyclonesActiveResponse,
  SignalLookupResponse,
  SignalsCurrentResponse,
  StormsResponse,
} from './types'

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path)
  const text = await res.text()
  let json: T | ApiError
  try {
    json = JSON.parse(text) as T | ApiError
  } catch {
    throw new Error('Invalid response from server')
  }
  if (!res.ok) {
    const err = json as ApiError
    const code = err.error?.code
    if (code === 'CONFIG' || code === 'API_KEY_MISSING') {
      throw new Error(
        'Weather data is not set up yet. The site owner needs a free key from bagyo.io/developers (BAGYO_API_KEY on Vercel).',
      )
    }
    throw new Error(err.error?.message ?? `Request failed (${res.status})`)
  }
  return json as T
}

export function fetchActiveCyclones() {
  return fetchJson<CyclonesActiveResponse>('/api/cyclones/active')
}

export function fetchSignalsCurrent() {
  return fetchJson<SignalsCurrentResponse>('/api/signals/current')
}

export function fetchSignalLookup(q: string) {
  return fetchJson<SignalLookupResponse>(`/api/signals/lookup?q=${encodeURIComponent(q)}`)
}

export function fetchStorms() {
  return fetchJson<StormsResponse>('/api/storms')
}
