import { CycloneCard } from '../components/CycloneCard'
import { PageIntro } from '../components/PageIntro'
import { PaperCard } from '../components/PaperCard'
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
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-2">
        <PageIntro
          title="Active storms"
          subtitle="Pinned bulletins from the current PAGASA tropical cyclone advisory."
        />
        <button type="button" onClick={() => refetch()} className="btn-ghost shrink-0 text-xs" disabled={isFetching}>
          Refresh
        </button>
      </div>

      {isLoading && <p className="font-medium">Loading…</p>}
      {isError && (
        <PaperCard className="p-4 text-sm font-medium text-[var(--color-stamp)]">
          {error instanceof Error ? error.message : 'Failed to load cyclones'}
        </PaperCard>
      )}

      {!isLoading && !isError && cyclones.length === 0 && (
        <PaperCard className="p-6 text-center font-medium text-[#5c4a38]">
          No active tropical cyclone in the bulletin feed right now.
        </PaperCard>
      )}

      <div className="space-y-5">
        {cyclones.map((c, i) => (
          <CycloneCard key={c.id ?? c.name} cyclone={c} index={i} />
        ))}
      </div>
    </div>
  )
}
