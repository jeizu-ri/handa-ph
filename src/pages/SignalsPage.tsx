import { useMemo } from 'react'
import { PageIntro } from '../components/PageIntro'
import { PaperCard } from '../components/PaperCard'
import { useSignalsCurrent } from '../hooks/queries'
import type { SignalArea } from '../lib/types'
import { TCWS_INFO, normalizeSignalLevel } from '../lib/tcws'
import type { SignalLevel } from '../lib/types'

function flattenSignals(data: unknown): SignalArea[] {
  if (!data || typeof data !== 'object') return []
  const root = data as { data?: Record<string, unknown> }
  const inner = root.data
  if (!inner) return []

  if (Array.isArray(inner.signals)) return inner.signals as SignalArea[]

  const byLevel = inner.byLevel as Record<string, SignalArea[]> | undefined
  if (byLevel) {
    const out: SignalArea[] = []
    for (const [level, areas] of Object.entries(byLevel)) {
      for (const a of areas ?? []) {
        out.push({ ...a, level: a.level ?? Number(level) })
      }
    }
    return out
  }
  return []
}

export function SignalsPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useSignalsCurrent()
  const signals = flattenSignals(data)

  const grouped = useMemo(() => {
    const map = new Map<number, SignalArea[]>()
    for (const s of signals) {
      const lvl = normalizeSignalLevel(s.level)
      if (lvl === 0) continue
      const list = map.get(lvl) ?? []
      list.push(s)
      map.set(lvl, list)
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0])
  }, [signals])

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-2">
        <PageIntro title="Signal board" subtitle="Areas under tropical cyclone wind signals nationwide, highest first." />
        <button type="button" onClick={() => refetch()} className="btn-ghost shrink-0 text-xs" disabled={isFetching}>
          Refresh
        </button>
      </div>

      {isLoading && <p className="font-medium">Loading…</p>}
      {isError && (
        <PaperCard className="p-4 text-sm font-medium text-[var(--color-stamp)]">
          {error instanceof Error ? error.message : 'Failed to load signals'}
        </PaperCard>
      )}

      {!isLoading && !isError && grouped.length === 0 && (
        <PaperCard className="p-6 text-center font-medium text-[#5c4a38]">
          No wind signals in effect in the current feed.
        </PaperCard>
      )}

      <div className="space-y-4">
        {grouped.map(([level, areas]) => {
          const info = TCWS_INFO[level as SignalLevel]
          return (
            <PaperCard key={level} pin tilt={level % 2 === 0 ? 'left' : 'right'} className="overflow-hidden">
              <div className={`${info.bg} ${info.text} px-4 py-3 font-display text-lg font-bold`}>
                {info.label} · {info.winds}
              </div>
              <ul className="divide-y-2 divide-dashed divide-[#d9ccb8]">
                {areas.map((a) => (
                  <li key={`${level}-${a.name}-${a.psgcCode ?? ''}`} className="px-4 py-2.5 text-sm font-medium">
                    {a.name}
                  </li>
                ))}
              </ul>
            </PaperCard>
          )
        })}
      </div>
    </div>
  )
}
