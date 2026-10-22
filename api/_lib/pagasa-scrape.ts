import * as cheerio from 'cheerio'

const BULLETIN_URL =
  'https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin'

const DISCLAIMER =
  'Parsed directly from the public DOST-PAGASA Severe Weather Bulletin page. Not an official PAGASA product. Always confirm with PAGASA before life-safety decisions.'

type Snapshot = {
  fetchedAt: string
  bulletinNumber: number | null
  issuedAtText: string | null
  cycloneName: string | null
  headline: string | null
  byLevel: Map<number, string[]>
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

  const snapshot: Snapshot = {
    fetchedAt: new Date().toISOString(),
    bulletinNumber,
    issuedAtText,
    cycloneName,
    headline,
    byLevel,
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
