import { CycloneCard } from '../components/CycloneCard'
import { useActiveCyclones } from '../hooks/queries'
import type { ActiveCyclone } from '../lib/types'

function extractCyclones(data: unknown): ActiveCyclone[] {
  if (!data || typeof data !== 'object') return []
  const d = data as { data?: unknown }
  if (Array.isArray(d.data)) return d.data as ActiveCyclone[]
  if (d.data && typeof d.data === 'object' && Array.isArray((d.data as { items?: unknown }).items)) {
    return (d.data as { items: ActiveCyclone[] }).items
  }
  return []
}

export function CyclonesPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useActiveCyclones()
  const cyclones = extractCyclones(data)

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-white">Active cyclones</h2>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-sm text-sky-400 underline"
          disabled={isFetching}
        >
          Refresh
        </button>
      </div>

      {isLoading && <p className="text-slate-400">Loading…</p>}
      {isError && (
        <p className="text-red-300">{error instanceof Error ? error.message : 'Failed to load cyclones'}</p>
      )}

      {!isLoading && !isError && cyclones.length === 0 && (
        <p className="rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-6 text-center text-slate-400">
          No active tropical cyclones in the feed right now.
        </p>
      )}

      <div className="space-y-3">
        {cyclones.map((c) => (
          <CycloneCard key={c.id ?? c.name} cyclone={c} />
        ))}
      </div>
    </div>
  )
}
