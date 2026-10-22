import { normalizeSignalLevel, TCWS_INFO } from '../lib/tcws'
import type { SignalLevel } from '../lib/types'

interface SignalBadgeProps {
  level: number | null | undefined
  size?: 'lg' | 'md'
}

export function SignalBadge({ level, size = 'lg' }: SignalBadgeProps) {
  const normalized = normalizeSignalLevel(level)
  const info = TCWS_INFO[normalized as SignalLevel]
  const isLarge = size === 'lg'

  return (
    <div
      className={`rounded-2xl border-2 ${info.border} ${info.bg} ${info.text} ${
        isLarge ? 'px-8 py-10 text-center' : 'px-4 py-3'
      }`}
      role="status"
      aria-label={`Wind signal ${normalized}`}
    >
      <div className={isLarge ? 'text-6xl font-black tabular-nums' : 'text-3xl font-bold tabular-nums'}>
        {normalized === 0 ? '—' : normalized}
      </div>
      <div className={isLarge ? 'mt-2 text-lg font-semibold' : 'mt-1 text-sm font-semibold'}>
        {info.label}
      </div>
      {normalized > 0 && (
        <div className={isLarge ? 'mt-1 text-sm opacity-90' : 'text-xs opacity-90'}>
          Winds {info.winds}
        </div>
      )}
    </div>
  )
}
