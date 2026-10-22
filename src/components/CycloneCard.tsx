import { formatManilaDateTime } from '../lib/format'
import { PAGASA_BULLETIN_URL } from '../lib/tcws'
import type { ActiveCyclone } from '../lib/types'

interface CycloneCardProps {
  cyclone: ActiveCyclone
}

export function CycloneCard({ cyclone }: CycloneCardProps) {
  const b = cyclone.latestBulletin
  const title = cyclone.internationalName
    ? `${cyclone.name} (${cyclone.internationalName})`
    : cyclone.name

  return (
    <article className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-sky-100">{title}</h3>
        {cyclone.classification && (
          <span className="shrink-0 rounded-md bg-slate-700 px-2 py-0.5 text-xs font-medium uppercase">
            {cyclone.classification}
          </span>
        )}
      </div>
      {b?.headline && <p className="mt-2 text-sm text-slate-300">{b.headline}</p>}
      {b?.summary && !b.headline && <p className="mt-2 text-sm text-slate-300">{b.summary}</p>}
      <p className="mt-3 text-xs text-slate-500">
        {b?.number != null && `Bulletin #${b.number} · `}
        Issued {formatManilaDateTime(b?.issuedAt)}
      </p>
      <a
        href={PAGASA_BULLETIN_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-sm font-medium text-sky-400 underline"
      >
        Official PAGASA bulletin
      </a>
    </article>
  )
}
