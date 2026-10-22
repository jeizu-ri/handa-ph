import { useEffect, useMemo, useState } from 'react'
import { PaperCard } from '../components/PaperCard'
import { PageIntro } from '../components/PageIntro'
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
  const [pulse, setPulse] = useState(false)

  const { data, isLoading, isError, error, isFetching, refetch, dataUpdatedAt } = useSignalLookup(saved)

  const level = normalizeSignalLevel(data?.data?.signal?.level)
  const suggestions = useMemo(() => filterLocations(locationInput), [locationInput])

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

  function applyLocation(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    setSavedLocation(trimmed)
    setSaved(trimmed)
    setLocationInput(trimmed)
    setAlert(null)
  }

  return (
    <div className="space-y-5">
      <PageIntro
        title="Aking signal"
        subtitle="Pin your barangay or province. We read the latest public PAGASA bulletin and show your tropical cyclone wind signal."
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
            onKeyDown={(e) => e.key === 'Enter' && applyLocation(locationInput)}
            placeholder="Metro Manila, Laguna, Batanes…"
            className="field-input flex-1"
            autoComplete="address-level2"
          />
          <button type="button" onClick={() => applyLocation(locationInput)} className="btn-primary shrink-0">
            Pin it
          </button>
        </div>

        {locationInput && suggestions.length > 0 && (
          <ul className="mt-2 border-2 border-[var(--color-ink)] bg-white">
            {suggestions.map((name) => (
              <li key={name} className="border-b border-[#e5dcc8] last:border-b-0">
                <button
                  type="button"
                  className="w-full px-3 py-2.5 text-left text-sm font-medium hover:bg-[#f5efe4]"
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
          className="mt-3 text-left text-sm font-semibold underline decoration-2 underline-offset-2"
          onClick={() => applyLocation(saved || 'Metro Manila')}
        >
          Quick pin: Metro Manila
        </button>
      </PaperCard>

      {alert && (
        <div role="alert">
          <PaperCard className="stamp-box p-3 text-sm">{alert}</PaperCard>
        </div>
      )}

      {!saved && (
        <p className="text-sm font-medium text-[#4a3d32]">Choose a location above to post your signal card on the board.</p>
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
          <PaperCard tilt="right" className="space-y-2 p-4 text-sm">
            <p>
              <span className="font-bold">Posted for:</span> {data.data.location?.name ?? saved}
            </p>
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
                No signal listed for this spelling — try the province name (e.g. “Laguna” province) or a nearby area
                under warning.
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
