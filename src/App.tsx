import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CyclonesPage } from './pages/CyclonesPage'
import { HomePage } from './pages/HomePage'
import { SettingsPage } from './pages/SettingsPage'
import { SignalsPage } from './pages/SignalsPage'

const MapPage = lazy(() => import('./pages/MapPage').then((m) => ({ default: m.MapPage })))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/cyclones" element={<CyclonesPage />} />
          <Route path="/signals" element={<SignalsPage />} />
          <Route
            path="/map"
            element={
              <Suspense fallback={<p className="p-4 text-slate-400">Loading map…</p>}>
                <MapPage />
              </Suspense>
            }
          />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
