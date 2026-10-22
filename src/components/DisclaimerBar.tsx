import { PAGASA_BULLETIN_URL, PAGASA_TCB_ARCHIVE } from '../lib/tcws'

export function DisclaimerBar() {
  return (
    <footer className="border-t border-[#c4a574] bg-[#e0d0b8] px-3 py-2 text-[0.6rem] leading-snug text-[#4a3d32]">
      <p className="font-semibold text-[var(--color-stamp)]">
        Not official — confirm with DOST-PAGASA before acting on warnings.
      </p>
      <p className="mt-0.5">
        <a href={PAGASA_BULLETIN_URL} target="_blank" rel="noopener noreferrer" className="font-bold underline">
          Bulletin
        </a>
        {' · '}
        <a href={PAGASA_TCB_ARCHIVE} target="_blank" rel="noopener noreferrer" className="font-bold underline">
          PDF archive
        </a>
      </p>
    </footer>
  )
}
