import { PaperCard } from '../components/PaperCard'
import { PageIntro } from '../components/PageIntro'
import { clearSavedPlace, getSavedPlace } from '../lib/storage'

export function SettingsPage() {
  const saved = getSavedPlace()

  return (
    <div className="space-y-5">
      <PageIntro title="Board notes" subtitle="How this app works and how to install it on your phone." />

      <PaperCard className="p-4">
        <h3 className="font-display text-lg font-bold">Pinned location</h3>
        <p className="mt-2 text-sm">{saved?.label || 'None yet — set it on the Signal tab.'}</p>
        {saved && (
          <button
            type="button"
            className="mt-3 text-sm font-bold text-[var(--color-stamp)] underline"
            onClick={() => {
              clearSavedPlace()
              window.location.href = '/'
            }}
          >
            Remove pin
          </button>
        )}
      </PaperCard>

      <PaperCard tilt="right" className="p-4 text-sm leading-relaxed">
        <h3 className="font-display text-lg font-bold">Data</h3>
        <p className="mt-2">
          Signals, storm text, and the map track come from the public PAGASA bulletin. Optional{' '}
          <code className="rounded bg-[#efe4d2] px-1">BAGYO_API_KEY</code> on the server enables bagyo.io tracks.
        </p>
      </PaperCard>

      <PaperCard className="p-4 text-sm">
        <h3 className="font-display text-lg font-bold">Alerts</h3>
        <p className="mt-2">
          Push notifications when your signal rises are planned. For now, refresh after PAGASA TV or radio advisories.
        </p>
      </PaperCard>

      <PaperCard tilt="left" className="p-4 text-sm">
        <h3 className="font-display text-lg font-bold">Install</h3>
        <p className="mt-2">
          Chrome: menu → Install app. iPhone Safari: Share → Add to Home Screen.
        </p>
      </PaperCard>
    </div>
  )
}
