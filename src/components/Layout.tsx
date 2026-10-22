import { NavLink, Outlet } from 'react-router-dom'
import { DisclaimerBar } from './DisclaimerBar'
import { IconGear, IconList, IconMap, IconSignal, IconStorm } from './NavIcons'

const tabs: { to: string; label: string; end?: boolean; Icon: typeof IconSignal }[] = [
  { to: '/', label: 'Signal', end: true, Icon: IconSignal },
  { to: '/cyclones', label: 'Storms', Icon: IconStorm },
  { to: '/signals', label: 'Areas', Icon: IconList },
  { to: '/map', label: 'Track', Icon: IconMap },
  { to: '/settings', label: 'More', Icon: IconGear },
]

export function Layout() {
  return (
    <div className="board-grain flex min-h-dvh flex-col">
      <header className="relative z-10 px-4 pt-5 pb-2">
        <div className="mx-auto flex max-w-lg items-end justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#5c4a38]">Barangay board</p>
            <h1 className="font-display text-3xl font-bold leading-none text-[var(--color-ink)]">Handa PH</h1>
          </div>
          <PaperTabLabel />
        </div>
      </header>

      <main className="relative z-10 flex-1 px-4 pb-28 pt-2">
        <div className="mx-auto max-w-lg">
          <Outlet />
        </div>
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-20 border-t-2 border-[#6b5438] bg-[var(--color-tab-idle)] px-1 pt-1 shadow-[0_-4px_20px_rgba(28,20,16,0.15)]"
        aria-label="Main"
      >
        <div className="mx-auto flex max-w-lg">
          {tabs.map(({ to, label, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-0.5 border-t-4 px-1 text-[0.65rem] font-bold uppercase tracking-wide transition-colors ${
                  isActive
                    ? 'border-[var(--color-ink)] bg-[var(--color-tab-active)] text-[var(--color-ink)]'
                    : 'border-transparent text-[#5c4a38] hover:bg-[#efe4d2]'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </div>
        <DisclaimerBar />
      </nav>
    </div>
  )
}

function PaperTabLabel() {
  return (
    <div
      className="paper-card px-3 py-1.5 text-right text-[0.65rem] font-bold uppercase tracking-wider text-[#5c4a38]"
      style={{ transform: 'rotate(2deg)' }}
    >
      Unofficial
      <br />
      <span className="text-[var(--color-stamp)]">Check PAGASA</span>
    </div>
  )
}
