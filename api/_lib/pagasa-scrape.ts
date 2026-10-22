import * as cheerio from 'cheerio'

const BULLETIN_URL =
  'https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin'

const DISCLAIMER =
  'Parsed directly from the public DOST-PAGASA Severe Weather Bulletin page. Not an official PAGASA product. Always confirm with PAGASA before life-safety decisions.'

type LatLon = { lat: number; lon: number }

type Snapshot = {
  fetchedAt: string
  bulletinNumber: number | null
  issuedAtText: string | null
  cycloneName: string | null
  headline: string | null
  byLevel: Map<number, string[]>
  eyeCenter: LatLon | null
  trackPoints: { time?: string; lat: number; lon: number }[]
}

/** Approximate coords for PAGASA “X km direction of Place” phrases */
const REFERENCE_POINTS: Record<string, LatLon> = {
  itbayat: { lat: 20.787, lon: 121.841 },
  batanes: { lat: 20.448, lon: 121.97 },
  manila: { lat: 14.5995, lon: 120.9842 },
  quezon: { lat: 14.676, lon: 121.0437 },
}

let cached: { at: number; snapshot: Snapshot } | null = null
const CACHE_MS = 5 * 60 * 1000

function parseIssuedAt(text: string | null): string | null {
  if (!text) return null
  const m = text.match(/Issued at\s+(.+)/i)
  return m ? m[1].trim() : text.trim()
}

function parseSignalLevel(classAttr: string): number | null {
  const m = classAttr.match(/signalno(\d)/)
  return m ? Number(m[1]) : null
}

function normalizeForMatch(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ')
}

function parseEyeCenter(text: string): LatLon | null {
  const m = text.match(/(\d+(?:\.\d+)?)\s*°?\s*N,\s*(\d+(?:\.\d+)?)\s*°?\s*E/i)
  if (!m) return null
  return { lat: Number(m[1]), lon: Number(m[2]) }
}

function bearingFromDirection(dir: string): number | null {
  const d = dir.toLowerCase().replace(/\s+/g, ' ')
  const map: Record<string, number> = {
    north: 0,
    northeast: 45,
    east: 90,
    southeast: 135,
    south: 180,
    southwest: 225,
    west: 270,
    northwest: 315,
    'north northeast': 22.5,
    'north northwest': 337.5,
  }
  return map[d] ?? null
}

function destinationPoint(lat: number, lon: number, distanceKm: number, bearingDeg: number): LatLon {
  const R = 6371
  const br = (bearingDeg * Math.PI) / 180
  const φ1 = (lat * Math.PI) / 180
  const λ1 = (lon * Math.PI) / 180
  const δ = distanceKm / R
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(br))
  const λ2 =
    λ1 +
    Math.atan2(Math.sin(br) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2))
  return { lat: (φ2 * 180) / Math.PI, lon: (λ2 * 180) / Math.PI }
}

function resolveReferencePlace(place: string): LatLon | null {
  const p = normalizeForMatch(place)
  for (const [key, coords] of Object.entries(REFERENCE_POINTS)) {
    if (p.includes(key)) return coords
  }
  return null
}

function parseForecastPositions($: cheerio.CheerioAPI): { time?: string; lat: number; lon: number }[] {
  const points: { time?: string; lat: number; lon: number }[] = []
  $('.panel-heading').each((_, heading) => {
    if (!$(heading).text().toLowerCase().includes('forecast position')) return
    $(heading)
      .parent()
      .find('.panel-body li')
      .each((__, li) => {
        const line = $(li).text().replace(/\s+/g, ' ').trim()
        const m = line.match(
          /^(.+?)\s*-\s*(\d+)\s*km\s+([A-Za-z\s]+?)\s+of\s+(.+?)(?:\s*\(OUTSIDE PAR\))?$/i,
        )
        if (!m) return
        const [, time, km, direction, place] = m
        const ref = resolveReferencePlace(place)
        const bearing = bearingFromDirection(direction.trim())
        if (!ref || bearing == null) return
        const dest = destinationPoint(ref.lat, ref.lon, Number(km), bearing)
        points.push({ time: time.trim(), lat: dest.lat, lon: dest.lon })
      })
  })
  return points
}

function panelBodyText($: cheerio.CheerioAPI, headingIncludes: string): string {
  let out = ''
  $('.panel-heading').each((_, el) => {
    if ($(el).text().toLowerCase().includes(headingIncludes.toLowerCase())) {
      out = $(el).next('.panel-body').text().replace(/\s+/g, ' ').trim()
    }
  })
  return out
}

export async function getPagasaSnapshot(): Promise<Snapshot> {
  const now = Date.now()
  if (cached && now - cached.at < CACHE_MS) return cached.snapshot

  const res = await fetch(BULLETIN_URL, {
    headers: {
      'User-Agent': 'HandaPH/1.0 (+https://github.com/jeizu-ri/handa-ph; PAGASA bulletin reader)',
      Accept: 'text/html',
    },
  })
  if (!res.ok) throw new Error(`PAGASA page returned ${res.status}`)

  const html = await res.text()
  const $ = cheerio.load(html)

  const bulletinHeader = $('#swb').first().text().trim()
  const bulletinNumber = bulletinHeader.match(/#(\d+)/)?.[1]
    ? Number(bulletinHeader.match(/#(\d+)/)![1])
    : null

  const cycloneTitle = $('.tab-pane.active h3').first().text().replace(/\s+/g, ' ').trim()
  const cycloneName =
    cycloneTitle.match(/"(.+?)"/)?.[1] ??
    cycloneTitle.match(/Typhoon\s+(\S+)/i)?.[1] ??
    null

  const issuedAtText = parseIssuedAt($('.tab-pane.active h5').first().text().trim())
  const headline = $('.tab-pane.active h5').eq(1).text().trim() || null

  const byLevel = new Map<number, string[]>()

  $('thead th[class*="signalno"]').each((_, th) => {
    const level = parseSignalLevel($(th).attr('class') ?? '')
    if (!level) return
    const tbody = $(th).closest('thead').next('tbody')
    const areas: string[] = []
    tbody.find('ul ul li').each((__, li) => {
      const t = $(li).text().replace(/\s+/g, ' ').trim()
      if (t && t !== '-') areas.push(t)
    })
    if (areas.length) byLevel.set(level, areas)
  })

  const eyeText = panelBodyText($, 'location of eye')
  const eyeCenter = parseEyeCenter(eyeText)
  const trackPoints = parseForecastPositions($)

  const snapshot: Snapshot = {
    fetchedAt: new Date().toISOString(),
    bulletinNumber,
    issuedAtText,
    cycloneName,
    headline,
    byLevel,
    eyeCenter,
    trackPoints,
  }
  cached = { at: now, snapshot }
  return snapshot
}

function areaMatchesQuery(area: string, query: string): boolean {
  const a = normalizeForMatch(area)
  const q = normalizeForMatch(query)
  if (a.includes(q) || q.includes(a)) return true

  // Metro Manila / NCR
  if (q.includes('metro manila') && (a.includes('metro manila') || a.includes('ncr'))) return true

  return false
}

export function lookupSignalLevel(snapshot: Snapshot, query: string): number {
  const q = query.trim()
  if (!q) return 0
  let best = 0
  for (const [level, areas] of snapshot.byLevel.entries()) {
    for (const area of areas) {
      if (areaMatchesQuery(area, q)) best = Math.max(best, level)
    }
  }
  return best
}

export function snapshotToLookupResponse(snapshot: Snapshot, query: string) {
  const level = lookupSignalLevel(snapshot, query)
  return {
    data: {
      location: { name: query },
      signal: level > 0 ? { level } : null,
      cyclone: snapshot.cycloneName ? { name: snapshot.cycloneName } : null,
      bulletin: {
        number: snapshot.bulletinNumber ?? undefined,
        issuedAt: snapshot.issuedAtText ?? undefined,
        headline: snapshot.headline ?? undefined,
      },
    },
    disclaimer: DISCLAIMER,
    source: 'DOST-PAGASA',
    meta: { mode: 'pagasa-scrape', fetchedAt: snapshot.fetchedAt },
  }
}

export function snapshotToSignalsCurrent(snapshot: Snapshot) {
  const byLevel: Record<string, { name: string; level: number }[]> = {}
  for (const [level, areas] of snapshot.byLevel.entries()) {
    byLevel[String(level)] = areas.map((name) => ({ name, level }))
  }
  return {
    data: { byLevel },
    disclaimer: DISCLAIMER,
    source: 'DOST-PAGASA',
    meta: { mode: 'pagasa-scrape', fetchedAt: snapshot.fetchedAt },
  }
}

export function snapshotToStormTracks(snapshot: Snapshot) {
  if (!snapshot.cycloneName || !snapshot.eyeCenter) {
    return {
      data: [] as {
        id: string
        name: string
        agency: string
        current: LatLon
        forecast: { lat: number; lon: number; time?: string }[]
      }[],
      disclaimer: DISCLAIMER,
      source: 'DOST-PAGASA',
      meta: { mode: 'pagasa-scrape', fetchedAt: snapshot.fetchedAt },
    }
  }

  const forecast = [
    { lat: snapshot.eyeCenter.lat, lon: snapshot.eyeCenter.lon, time: snapshot.issuedAtText ?? undefined },
    ...snapshot.trackPoints,
  ]

  return {
    data: [
      {
        id: snapshot.cycloneName.toLowerCase(),
        name: snapshot.cycloneName,
        agency: 'PAGASA',
        current: snapshot.eyeCenter,
        forecast,
      },
    ],
    disclaimer: DISCLAIMER,
    source: 'DOST-PAGASA',
    meta: { mode: 'pagasa-scrape', fetchedAt: snapshot.fetchedAt },
  }
}

export function snapshotToCyclonesActive(snapshot: Snapshot) {
  if (!snapshot.cycloneName && !snapshot.headline) {
    return { data: [], disclaimer: DISCLAIMER, meta: { mode: 'pagasa-scrape', fetchedAt: snapshot.fetchedAt } }
  }
  return {
    data: [
      {
        id: snapshot.cycloneName?.toLowerCase() ?? 'active',
        name: snapshot.cycloneName ?? 'Active cyclone',
        latestBulletin: {
          number: snapshot.bulletinNumber ?? undefined,
          issuedAt: snapshot.issuedAtText ?? undefined,
          headline: snapshot.headline ?? undefined,
        },
      },
    ],
    disclaimer: DISCLAIMER,
    source: 'DOST-PAGASA',
    meta: { mode: 'pagasa-scrape', fetchedAt: snapshot.fetchedAt },
  }
}
