import { PaperCard } from './PaperCard'
import { formatManilaDateTime } from '../lib/format'
import { PAGASA_BULLETIN_URL } from '../lib/tcws'
import type { ActiveCyclone } from '../lib/types'

interface CycloneCardProps {
  cyclone: ActiveCyclone
  index: number
}

export function CycloneCard({ cyclone, index }: CycloneCardProps) {
  const b = cyclone.latestBulletin
  const title = cyclone.internationalName
    ? `${cyclone.name} (${cyclone.internationalName})`
    : cyclone.name

  return (
    <PaperCard pin tilt={index % 2 === 0 ? 'right' : 'left'} className="p-4">
      <div className="flex items-start justify-between gap-2 border-b-2 border-dashed border-[#c9b89a] pb-2">
        <h3 className="font-display text-lg font-bold leading-tight">{title}</h3>
        {cyclone.classification && (
          <span className="shrink-0 border-2 border-[var(--color-ink)] px-2 py-0.5 text-[0.65rem] font-bold uppercase">
            {cyclone.classification}
          </span>
        )}
      </div>
      {b?.headline && <p className="mt-3 text-sm leading-relaxed">{b.headline}</p>}
      {b?.summary && !b.headline && <p className="mt-3 text-sm leading-relaxed">{b.summary}</p>}
      <p className="mt-3 text-xs font-semibold text-[#5c4a38]">
        {b?.number != null && `Bulletin #${b.number} · `}
        Issued {formatManilaDateTime(b?.issuedAt)}
      </p>
      <a
        href={PAGASA_BULLETIN_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-sm font-bold underline decoration-2 underline-offset-2"
      >
        Open official PAGASA bulletin →
      </a>
    </PaperCard>
  )
}
