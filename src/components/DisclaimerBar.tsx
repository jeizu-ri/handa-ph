import { PAGASA_BULLETIN_URL, PAGASA_TCB_ARCHIVE } from '../lib/tcws'

export function DisclaimerBar() {
  return (
    <footer className="border-t border-slate-700 bg-slate-900/90 px-4 py-3 text-xs text-slate-400">
      <p className="font-medium text-amber-200/90">
        Unofficial mirror — always confirm with DOST-PAGASA before life-safety decisions.
      </p>
      <p className="mt-1">
        <a
          href={PAGASA_BULLETIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 underline"
        >
          Severe Weather Bulletin
        </a>
        {' · '}
        <a
          href={PAGASA_TCB_ARCHIVE}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 underline"
        >
          TCB PDF archive
        </a>
      </p>
    </footer>
  )
}
