import type { Storm } from './types'

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/** Show track map when user is under signal or a storm center is within ~550 km. */
export function shouldShowNearbyStormMap(
  storms: Storm[],
  signalLevel: number,
  user?: { lat: number; lon: number } | null,
): boolean {
  if (storms.length === 0) return false
  if (signalLevel >= 1) return true
  if (!user) return false
  for (const s of storms) {
    const lat = s.current?.lat
    const lon = s.current?.lon
    if (lat == null || lon == null) continue
    if (haversineKm(user.lat, user.lon, lat, lon) <= 550) return true
  }
  return false
}
