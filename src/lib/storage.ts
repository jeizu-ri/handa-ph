const PLACE_KEY = 'handa.savedPlace'
const LOCATION_KEY = 'handa.savedLocation'
const LAST_SIGNAL_KEY = 'handa.lastSignalLevel'

export interface SavedPlace {
  label: string
  lookup: string
  lat?: number
  lon?: number
}

export function getSavedPlace(): SavedPlace | null {
  try {
    const raw = localStorage.getItem(PLACE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as SavedPlace
      if (parsed.label && parsed.lookup) return parsed
    }
    const legacy = localStorage.getItem(LOCATION_KEY)
    if (legacy) return { label: legacy, lookup: legacy }
  } catch {
    /* ignore */
  }
  return null
}

export function setSavedPlace(place: SavedPlace) {
  try {
    localStorage.setItem(PLACE_KEY, JSON.stringify(place))
    localStorage.setItem(LOCATION_KEY, place.label)
  } catch {
    /* ignore */
  }
}

export function clearSavedPlace() {
  try {
    localStorage.removeItem(PLACE_KEY)
    localStorage.removeItem(LOCATION_KEY)
  } catch {
    /* ignore */
  }
}

/** @deprecated use getSavedPlace */
export function getSavedLocation(): string {
  return getSavedPlace()?.label ?? ''
}

/** @deprecated use setSavedPlace */
export function setSavedLocation(name: string) {
  setSavedPlace({ label: name, lookup: name })
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
