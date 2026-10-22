export interface PlaceSuggestion {
  label: string
  lat: number
  lon: number
  lookup: string
}

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const res = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) return []
  const json = (await res.json()) as { data?: PlaceSuggestion[] }
  return json.data ?? []
}

export async function reversePlace(lat: number, lon: number): Promise<PlaceSuggestion | null> {
  const res = await fetch(`/api/locations/reverse?lat=${lat}&lon=${lon}`)
  if (!res.ok) return null
  const json = (await res.json()) as { data?: PlaceSuggestion }
  return json.data ?? null
}
