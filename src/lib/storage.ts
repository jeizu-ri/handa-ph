const LOCATION_KEY = 'handa.savedLocation'
const LAST_SIGNAL_KEY = 'handa.lastSignalLevel'

export function getSavedLocation(): string {
  try {
    return localStorage.getItem(LOCATION_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setSavedLocation(name: string) {
  try {
    localStorage.setItem(LOCATION_KEY, name)
  } catch {
    /* ignore */
  }
}

export function getLastSignalLevel(): number | null {
  try {
    const v = localStorage.getItem(LAST_SIGNAL_KEY)
    return v == null ? null : Number(v)
  } catch {
    return null
  }
}

export function setLastSignalLevel(level: number) {
  try {
    localStorage.setItem(LAST_SIGNAL_KEY, String(level))
  } catch {
    /* ignore */
  }
}
