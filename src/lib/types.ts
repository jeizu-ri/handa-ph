export type SignalLevel = 0 | 1 | 2 | 3 | 4 | 5

export interface ApiError {
  error: { code: string; message: string }
}

export interface SignalLookupData {
  location?: { name: string; psgcCode?: string | null }
  signal?: {
    level: number
    windSpeedKmh?: { min?: number; max?: number }
    coverage?: string
  } | null
  cyclone?: { name: string; internationalName?: string } | null
  bulletin?: { number?: number; issuedAt?: string } | null
}

export interface SignalLookupResponse {
  data: SignalLookupData
  disclaimer?: string
}

export interface CycloneBulletin {
  number?: number
  issuedAt?: string
  headline?: string
  summary?: string
}

export interface ActiveCyclone {
  id: string
  name: string
  internationalName?: string
  classification?: string
  status?: string
  latestBulletin?: CycloneBulletin
}

export interface CyclonesActiveResponse {
  data: ActiveCyclone[]
  disclaimer?: string
}

export interface SignalArea {
  name: string
  psgcCode?: string | null
  level: number
}

export interface SignalsCurrentResponse {
  data: {
    byLevel?: Record<string, SignalArea[]>
    signals?: SignalArea[]
  }
  disclaimer?: string
}

export interface StormTrackPoint {
  lat: number
  lon: number
  time?: string
}

export interface Storm {
  id: string
  name: string
  basin?: string
  agency?: string
  classification?: string
  current?: { lat: number; lon: number }
  forecast?: StormTrackPoint[]
}

export interface StormsResponse {
  storms?: Storm[]
  data?: Storm[]
}
