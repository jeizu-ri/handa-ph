import { useMemo } from 'react'
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
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-white">Signals nationwide</h2>
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
        <p className="text-red-300">{error instanceof Error ? error.message : 'Failed to load signals'}</p>
      )}

      {!isLoading && !isError && grouped.length === 0 && (
        <p className="rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-6 text-center text-slate-400">
          No wind signals are in effect according to the current feed.
        </p>
      )}

      <div className="space-y-4">
        {grouped.map(([level, areas]) => {
          const info = TCWS_INFO[level as SignalLevel]
          return (
            <section key={level} className={`rounded-xl border ${info.border} overflow-hidden`}>
              <div className={`${info.bg} ${info.text} px-4 py-2 font-semibold`}>
                {info.label} · {info.winds}
              </div>
              <ul className="divide-y divide-slate-700 bg-slate-800/50">
                {areas.map((a) => (
                  <li key={`${level}-${a.name}-${a.psgcCode ?? ''}`} className="px-4 py-2 text-sm text-slate-200">
                    {a.name}
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
