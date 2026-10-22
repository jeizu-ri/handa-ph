type NominatimRow = {
  display_name: string
  lat: string
  lon: string
  address?: Record<string, string>
}

export type PlaceResult = {
  label: string
  lat: number
  lon: number
  lookup: string
}

const UA = 'HandaPH/1.0 (typhoon alerts; contact: github.com/jeizu-ri/handa-ph)'

function formatPlaceLabel(row: NominatimRow): string {
  const a = row.address ?? {}
  const city = a.city || a.town || a.municipality || a.village || a.suburb
  const province = a.state || a.province || a.region
  const parts = [city, province].filter(Boolean)
  if (parts.length) return parts.join(', ')
  return row.display_name.split(',').slice(0, 3).join(', ')
}

function buildLookupQuery(row: NominatimRow): string {
  const a = row.address ?? {}
  const city = a.city || a.town || a.municipality || a.village
  if (city) return city
  if (a.state) return a.state
  return formatPlaceLabel(row)
}

export async function searchPhLocations(query: string): Promise<PlaceResult[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'json')
  url.searchParams.set('countrycodes', 'ph')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('limit', '8')
  url.searchParams.set('q', q.includes('Philippines') ? q : `${q}, Philippines`)

  const upstream = await fetch(url.toString(), {
    headers: { Accept: 'application/json', 'User-Agent': UA },
  })
  if (!upstream.ok) throw new Error('search failed')
  const rows = (await upstream.json()) as NominatimRow[]
  return rows.map((row) => ({
    label: formatPlaceLabel(row),
    lat: Number(row.lat),
    lon: Number(row.lon),
    lookup: buildLookupQuery(row),
  }))
}

export async function reversePhLocation(lat: number, lon: number): Promise<PlaceResult> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('format', 'json')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lon))
  url.searchParams.set('addressdetails', '1')

  const upstream = await fetch(url.toString(), {
    headers: { Accept: 'application/json', 'User-Agent': UA },
  })
  if (!upstream.ok) throw new Error('reverse failed')
  const row = (await upstream.json()) as NominatimRow
  const a = row.address ?? {}
  const city = a.city || a.town || a.municipality || a.village || a.suburb
  const province = a.state || a.province
  const label = [city, province].filter(Boolean).join(', ') || row.display_name.split(',').slice(0, 2).join(', ')
  const lookup = city || province || label
  return { label, lat, lon, lookup }
}
