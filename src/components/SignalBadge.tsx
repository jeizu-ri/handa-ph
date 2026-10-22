import { PaperCard } from './PaperCard'
import { normalizeSignalLevel, TCWS_INFO } from '../lib/tcws'
import type { SignalLevel } from '../lib/types'

interface SignalBadgeProps {
  level: number | null | undefined
  size?: 'lg' | 'md'
  pulse?: boolean
}

export function SignalBadge({ level, size = 'lg', pulse = false }: SignalBadgeProps) {
  const normalized = normalizeSignalLevel(level)
  const info = TCWS_INFO[normalized as SignalLevel]
  const isLarge = size === 'lg'

  return (
    <PaperCard
      pin
      tilt="left"
      className={`${info.bg} ${info.text} ${info.border} border-[3px] ${pulse ? 'signal-pulse' : ''} ${
        isLarge ? 'px-6 py-8 text-center' : 'px-4 py-3'
      }`}
    >
      <div
        className={isLarge ? 'text-[5.5rem] font-black leading-none tabular-nums' : 'text-3xl font-bold tabular-nums'}
        role="status"
        aria-label={`Wind signal ${normalized}`}
      >
        {normalized === 0 ? '—' : normalized}
      </div>
      <div className={`font-display font-bold ${isLarge ? 'mt-2 text-xl' : 'mt-1 text-sm'}`}>{info.label}</div>
      {normalized > 0 && (
        <div className={isLarge ? 'mt-2 text-sm font-semibold opacity-95' : 'text-xs font-semibold opacity-95'}>
          Winds {info.winds}
        </div>
      )}
      {normalized === 0 && isLarge && (
        <p className="mt-3 text-sm font-medium opacity-90">No TCWS posted for your place in this bulletin.</p>
      )}
    </PaperCard>
  )
}
