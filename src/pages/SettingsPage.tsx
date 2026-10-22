import { getSavedLocation, setSavedLocation } from '../lib/storage'

export function SettingsPage() {
  const saved = getSavedLocation()

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h2 className="text-xl font-semibold text-white">Settings</h2>

      <section className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
        <h3 className="font-medium text-slate-200">Saved location</h3>
        <p className="mt-1 text-sm text-slate-400">{saved || 'None — set on My signal tab'}</p>
        {saved && (
          <button
            type="button"
            className="mt-3 text-sm text-red-400 underline"
            onClick={() => {
              setSavedLocation('')
              window.location.href = '/'
            }}
          >
            Clear saved location
          </button>
        )}
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
        <h3 className="font-medium text-slate-200">Data source</h3>
        <p className="mt-1 text-sm text-slate-400">
          Wind signals, cyclone text, and the map track are read from the public PAGASA bulletin (no API key required).
          Optional <code className="text-sky-300">BAGYO_API_KEY</code> on Vercel switches to bagyo.io for richer tracks.
        </p>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
        <h3 className="font-medium text-slate-200">Notifications</h3>
        <p className="mt-1 text-sm text-slate-400">
          Web push alerts when your signal rises will arrive in a future update. For now, keep this app open or
          check My signal after PAGASA advisories.
        </p>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
        <h3 className="font-medium text-slate-200">Language</h3>
        <p className="mt-1 text-sm text-slate-400">English (Filipino copy coming soon)</p>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
        <h3 className="font-medium text-slate-200">Install app</h3>
        <p className="mt-1 text-sm text-slate-400">
          On Chrome: menu → Install Handa PH. On Safari (iOS): Share → Add to Home Screen.
        </p>
      </section>
    </div>
  )
}
