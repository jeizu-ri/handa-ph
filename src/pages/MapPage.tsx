import { StormMap } from '../components/StormMap'
import { useStorms } from '../hooks/queries'
import type { Storm } from '../lib/types'

function extractStorms(data: unknown): Storm[] {
  if (!data || typeof data !== 'object') return []
  const d = data as StormsResponseShape
  if (Array.isArray(d.storms)) return d.storms
  if (Array.isArray(d.data)) return d.data
  return []
}

interface StormsResponseShape {
  storms?: Storm[]
  data?: Storm[]
}

export function MapPage() {
  const { data, isLoading, isError, error } = useStorms()
  const storms = extractStorms(data)

  const parStorms = storms.filter((s) => {
    const lat = s.current?.lat
    const lon = s.current?.lon
    if (lat == null || lon == null) return true
    return lat >= 4 && lat <= 22 && lon >= 116 && lon <= 128
  })

  const stormsError = isError && error instanceof Error ? error.message : null

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-xl font-semibold text-white">Track map</h2>
      <p className="text-sm text-slate-400">Philippine area of responsibility — forecast tracks from bagyo.io</p>

      {isLoading && <p className="text-slate-400">Loading tracks…</p>}

      <StormMap storms={isLoading ? [] : parStorms} error={stormsError} />
    </div>
  )
}
