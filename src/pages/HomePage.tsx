import { useEffect, useMemo, useState } from 'react'
import { SignalBadge } from '../components/SignalBadge'
import { useSignalLookup } from '../hooks/queries'
import { formatManilaDateTime } from '../lib/format'
import { filterLocations } from '../lib/psgc-search'
import { getLastSignalLevel, getSavedLocation, setLastSignalLevel, setSavedLocation } from '../lib/storage'
import { normalizeSignalLevel } from '../lib/tcws'

export function HomePage() {
  const [locationInput, setLocationInput] = useState(() => getSavedLocation())
  const [saved, setSaved] = useState(() => getSavedLocation())
  const [alert, setAlert] = useState<string | null>(null)

  const { data, isLoading, isError, error, isFetching, refetch, dataUpdatedAt } = useSignalLookup(saved)

  const level = normalizeSignalLevel(data?.data?.signal?.level)
  const suggestions = useMemo(() => filterLocations(locationInput), [locationInput])

  useEffect(() => {
    if (!saved || isLoading || !data) return
    const prev = getLastSignalLevel()
    if (prev != null && level > prev) {
      setAlert(`Wind signal raised to TCWS #${level} for your area. Confirm with PAGASA.`)
    }
    setLastSignalLevel(level)
  }, [level, saved, isLoading, data])

  function applyLocation(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    setSavedLocation(trimmed)
    setSaved(trimmed)
    setLocationInput(trimmed)
    setAlert(null)
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <section>
        <h2 className="text-xl font-semibold text-white">Aking signal</h2>
        <p className="mt-1 text-sm text-slate-400">Wind signal for your saved location</p>

        <label className="mt-4 block text-sm font-medium text-slate-300" htmlFor="location">
          Location
        </label>
        <div className="mt-1 flex gap-2">
          <input
            id="location"
            type="search"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyLocation(locationInput)}
            placeholder="e.g. Metro Manila, Batanes"
            className="min-h-11 flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 text-base text-white placeholder:text-slate-500"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => applyLocation(locationInput)}
            className="min-h-11 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-500"
          >
            Save
          </button>
        </div>

        {locationInput && suggestions.length > 0 && (
          <ul className="mt-2 rounded-lg border border-slate-700 bg-slate-800/80">
            {suggestions.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-700"
                  onClick={() => applyLocation(name)}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          className="mt-2 text-sm text-sky-400 underline"
          onClick={() => {
            if (!navigator.geolocation) return
            navigator.geolocation.getCurrentPosition(
              () => {
                applyLocation(saved || 'Metro Manila')
              },
              () => {
                applyLocation('Metro Manila')
              },
            )
          }}
        >
          Use approximate location (defaults to saved or Metro Manila)
        </button>
      </section>

      {alert && (
        <div
          className="rounded-lg border border-amber-600 bg-amber-950/50 px-4 py-3 text-sm text-amber-100"
          role="alert"
        >
          {alert}
        </div>
      )}

      {!saved && (
        <p className="text-sm text-slate-400">Choose a location above to see your current wind signal.</p>
      )}

      {saved && isLoading && <p className="text-slate-400">Loading signal…</p>}
      {saved && isError && (
        <p className="text-red-300">{error instanceof Error ? error.message : 'Could not load signal'}</p>
      )}

      {saved && data && (
        <>
          <SignalBadge level={data.data.signal?.level} />
          <div className="space-y-1 text-sm text-slate-400">
            <p>
              <span className="text-slate-300">Area:</span>{' '}
              {data.data.location?.name ?? saved}
            </p>
            {data.data.cyclone?.name && (
              <p>
                <span className="text-slate-300">Cyclone:</span> {data.data.cyclone.name}
              </p>
            )}
            {data.data.bulletin?.issuedAt && (
              <p>
                <span className="text-slate-300">Bulletin issued:</span>{' '}
                {formatManilaDateTime(data.data.bulletin.issuedAt)}
              </p>
            )}
            <p className="text-xs text-slate-500">
              Updated {formatManilaDateTime(new Date(dataUpdatedAt).toISOString())}
              {isFetching ? ' · refreshing…' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="w-full min-h-11 rounded-lg border border-slate-600 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            Refresh now
          </button>
        </>
      )}
    </div>
  )
}
