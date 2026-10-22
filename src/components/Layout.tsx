import { NavLink, Outlet } from 'react-router-dom'
import { DisclaimerBar } from './DisclaimerBar'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex-1 py-2 text-center text-xs font-medium sm:text-sm ${
    isActive ? 'text-sky-300 border-t-2 border-sky-400' : 'text-slate-400 border-t-2 border-transparent'
  }`

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-sky-950 px-4 py-3 shadow-md">
        <h1 className="text-lg font-bold tracking-tight text-white">Handa PH</h1>
        <p className="text-xs text-sky-200/80">Typhoon & wind signal alerts</p>
      </header>

      <main className="flex-1 px-4 py-4 pb-24">
        <Outlet />
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 flex border-t border-slate-700 bg-slate-900/95 backdrop-blur"
        aria-label="Main"
      >
        <NavLink to="/" className={navClass} end>
          My signal
        </NavLink>
        <NavLink to="/cyclones" className={navClass}>
          Cyclones
        </NavLink>
        <NavLink to="/signals" className={navClass}>
          Signals
        </NavLink>
        <NavLink to="/map" className={navClass}>
          Map
        </NavLink>
        <NavLink to="/settings" className={navClass}>
          Settings
        </NavLink>
      </nav>

      <DisclaimerBar />
    </div>
  )
}
