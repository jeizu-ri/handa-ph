import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { PaperCard } from '../components/PaperCard'
import { PageIntro } from '../components/PageIntro'
import { SignalBadge } from '../components/SignalBadge'
import { useSignalLookup, useStorms } from '../hooks/queries'
import { formatManilaDateTime } from '../lib/format'
import { shouldShowNearbyStormMap } from '../lib/geo'
import { reversePlace, searchPlaces, type PlaceSuggestion } from '../lib/locations'
import {
  getLastSignalLevel,
  getSavedPlace,
  setLastSignalLevel,
  setSavedPlace,
  type SavedPlace,
} from '../lib/storage'
import { normalizeSignalLevel } from '../lib/tcws'
import type { Storm } from '../lib/types'

const NearbyStormMap = lazy(() =>
  import('../components/NearbyStormMap').then((m) => ({ default: m.NearbyStormMap })),
)

function extractStorms(data: unknown): Storm[] {
  if (!data || typeof data !== 'object') return []
  const d = data as { data?: Storm[]; storms?: Storm[] }
  if (Array.isArray(d.data)) return d.data
  if (Array.isArray(d.storms)) return d.storms
  return []
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

export function HomePage() {
  const initial = getSavedPlace()
  const [locationInput, setLocationInput] = useState(initial?.label ?? '')
  const [saved, setSaved] = useState<SavedPlace | null>(initial)
  const [alert, setAlert] = useState<string | null>(null)
  const [pulse, setPulse] = useState(false)
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)

  const debouncedQuery = useDebounced(locationInput, 350)
  const lookup = saved?.lookup ?? ''

  const { data, isLoading, isError, error, isFetching, refetch, dataUpdatedAt } = useSignalLookup(lookup)
  const { data: stormsData } = useStorms()

  const level = normalizeSignalLevel(data?.data?.signal?.level)
  const storms = useMemo(() => extractStorms(stormsData), [stormsData])
  const userCoords =
    saved?.lat != null && saved?.lon != null ? { lat: saved.lat, lon: saved.lon } : null
  const showMap = shouldShowNearbyStormMap(storms, level, userCoords)

  useEffect(() => {
    if (!saved || isLoading || !data) return
    const prev = getLastSignalLevel()
    if (prev != null && level > prev) {
      setAlert(`Wind signal raised to TCWS #${level}. Confirm with PAGASA before you go out.`)
      setPulse(true)
      const t = setTimeout(() => setPulse(false), 700)
      setLastSignalLevel(level)
      return () => clearTimeout(t)
    }
    setLastSignalLevel(level)
  }, [level, saved, isLoading, data])

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSuggestions([])
      return
    }
    let cancelled = false
    setSearching(true)
    void searchPlaces(debouncedQuery).then((rows) => {
      if (!cancelled) {
        setSuggestions(rows)
        setSearching(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  function applyPlace(place: PlaceSuggestion) {
    const next: SavedPlace = {
      label: place.label,
      lookup: place.lookup,
      lat: place.lat,
      lon: place.lon,
    }
    setSavedPlace(next)
    setSaved(next)
    setLocationInput(place.label)
    setSuggestions([])
    setAlert(null)
  }

  function applyManual() {
    const label = locationInput.trim()
    if (!label) return
    const next: SavedPlace = { label, lookup: label.split(',')[0]?.trim() || label }
    setSavedPlace(next)
    setSaved(next)
    setSuggestions([])
    setAlert(null)
  }

  async function useMyLocation() {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const place = await reversePlace(pos.coords.latitude, pos.coords.longitude)
        setGeoLoading(false)
        if (place) applyPlace(place)
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    )
  }

  const matchedArea = (data?.data?.location as { matchedArea?: string } | undefined)?.matchedArea

  return (
    <div className="space-y-5">
      <PageIntro
        title="Aking signal"
        subtitle="Search your city or municipality (not just the province). We match your place against the latest PAGASA bulletin."
      />

      <PaperCard pin tilt="right" className="p-4">
        <label className="block text-sm font-bold uppercase tracking-wide" htmlFor="location">
          Your location
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="location"
            type="search"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyManual()}
            placeholder="e.g. Calamba, Santa Rosa, Cebu City"
            className="field-input flex-1"
            autoComplete="street-address"
          />
          <button type="button" onClick={applyManual} className="btn-primary shrink-0">
            Pin it
          </button>
        </div>

        {searching && <p className="mt-2 text-xs font-semibold text-[#5c4a38]">Searching places…</p>}

        {suggestions.length > 0 && (
          <ul className="mt-2 max-h-52 overflow-y-auto border-2 border-[var(--color-ink)] bg-white">
            {suggestions.map((place) => (
              <li key={`${place.label}-${place.lat}`} className="border-b border-[#e5dcc8] last:border-b-0">
                <button
                  type="button"
                  className="w-full px-3 py-2.5 text-left text-sm font-medium hover:bg-[#f5efe4]"
                  onClick={() => applyPlace(place)}
                >
                  {place.label}
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          className="mt-3 text-left text-sm font-semibold underline decoration-2 underline-offset-2 disabled:opacity-60"
          onClick={useMyLocation}
          disabled={geoLoading}
        >
          {geoLoading ? 'Finding your location…' : 'Use my current location (GPS)'}
        </button>
      </PaperCard>

      {alert && (
        <div role="alert">
          <PaperCard className="stamp-box p-3 text-sm">{alert}</PaperCard>
        </div>
      )}

      {!saved && (
        <p className="text-sm font-medium text-[#4a3d32]">
          Pick a city or municipality from the list, or use GPS, to post your signal card.
        </p>
      )}

      {saved && isLoading && <p className="font-medium text-[#4a3d32]">Reading bulletin…</p>}
      {saved && isError && (
        <PaperCard className="border-2 border-[var(--color-stamp)] p-4 text-sm font-medium text-[var(--color-stamp)]">
          {error instanceof Error ? error.message : 'Could not load signal'}
        </PaperCard>
      )}

      {saved && data && (
        <>
          <SignalBadge level={data.data.signal?.level} pulse={pulse} />

          {showMap && (
            <PaperCard pin tilt="left" className="overflow-hidden p-2">
              <Suspense fallback={<p className="p-2 text-sm font-medium">Loading map…</p>}>
                <NearbyStormMap
                  storms={storms}
                  user={userCoords}
                  cycloneName={data.data.cyclone?.name}
                />
              </Suspense>
            </PaperCard>
          )}

          <PaperCard tilt="right" className="space-y-2 p-4 text-sm">
            <p>
              <span className="font-bold">Pinned:</span> {saved.label}
            </p>
            {matchedArea && (
              <p className="text-[#5c4a38]">
                Signal matched using area name “{matchedArea}” from the bulletin.
              </p>
            )}
            {data.data.cyclone?.name && (
              <p>
                <span className="font-bold">Cyclone:</span> {data.data.cyclone.name}
              </p>
            )}
            {data.data.bulletin?.issuedAt && (
              <p>
                <span className="font-bold">Bulletin time:</span> {formatManilaDateTime(data.data.bulletin.issuedAt)}
              </p>
            )}
            {level === 0 && (
              <p className="text-[#5c4a38]">
                No signal listed for this place. PAGASA often names provinces or regions — your city may still be
                safe while a nearby province is under warning.
              </p>
            )}
            <p className="text-xs font-semibold text-[#5c4a38]">
              Updated {formatManilaDateTime(new Date(dataUpdatedAt).toISOString())}
              {isFetching ? ' · refreshing…' : ''}
            </p>
          </PaperCard>
          <button type="button" onClick={() => refetch()} className="btn-ghost w-full">
            Refresh bulletin
          </button>
        </>
      )}
    </div>
  )
}
