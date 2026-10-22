import { PageIntro } from '../components/PageIntro'
import { PaperCard } from '../components/PaperCard'
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
    <div className="space-y-5">
      <PageIntro
        title="Storm track"
        subtitle="Map pinned from the PAGASA bulletin path. Positions are approximate — use official advisories for navigation."
      />

      {isLoading && <p className="font-medium">Loading track…</p>}

      <PaperCard pin tilt="left" className="overflow-hidden p-2">
        <StormMap storms={isLoading ? [] : parStorms} error={stormsError} />
      </PaperCard>
    </div>
  )
}
