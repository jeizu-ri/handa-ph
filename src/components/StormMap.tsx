import * as maplibregl from 'maplibre-gl'
import { useEffect, useRef } from 'react'
import type { Storm } from '../lib/types'

const PAR_BOUNDS: [[number, number], [number, number]] = [
  [116, 4.5],
  [127, 21],
]

interface StormMapProps {
  storms: Storm[]
  error?: string | null
  userMarker?: { lat: number; lon: number } | null
  compact?: boolean
}

function stormPoints(storm: Storm): [number, number][] {
  const points: [number, number][] = []
  if (storm.current?.lon != null && storm.current?.lat != null) {
    points.push([storm.current.lon, storm.current.lat])
  }
  const path = storm.forecast ?? (storm as Storm & { track?: { lat: number; lon: number }[] }).track ?? []
  for (const p of path) {
    if (p.lon != null && p.lat != null) points.push([p.lon, p.lat])
  }
  return points
}

export function StormMap({ storms, error, userMarker, compact }: StormMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const stormsRef = useRef(storms)
  const userRef = useRef(userMarker)
  stormsRef.current = storms
  userRef.current = userMarker

  const drawStorms = (map: maplibregl.Map) => {
    if (!map.isStyleLoaded()) return

    const layers = map.getStyle()?.layers ?? []
    for (const layer of layers) {
      if (
        (layer.id.startsWith('storm-') || layer.id.startsWith('user-')) &&
        map.getLayer(layer.id)
      ) {
        map.removeLayer(layer.id)
      }
    }
    const sources = map.getStyle()?.sources ?? {}
    for (const id of Object.keys(sources)) {
      if ((id.startsWith('storm-') || id.startsWith('user-')) && map.getSource(id)) {
        map.removeSource(id)
      }
    }

    stormsRef.current.forEach((storm, index) => {
      const points = stormPoints(storm)
      if (points.length === 0) return

      const lineSource = `storm-${index}-line`
      const pointSource = `storm-${index}-point`

      map.addSource(lineSource, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: { name: storm.name },
          geometry: { type: 'LineString', coordinates: points },
        },
      })
      map.addLayer({
        id: `${lineSource}-layer`,
        type: 'line',
        source: lineSource,
        paint: { 'line-color': '#c41e1e', 'line-width': 4 },
      })

      map.addSource(pointSource, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: { name: storm.name },
          geometry: { type: 'Point', coordinates: points[0] },
        },
      })
      map.addLayer({
        id: `${pointSource}-layer`,
        type: 'circle',
        source: pointSource,
        paint: {
          'circle-radius': 10,
          'circle-color': '#c41e1e',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#faf6ef',
        },
      })
    })

    const user = userRef.current
    if (user) {
      map.addSource('user-marker', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'Point', coordinates: [user.lon, user.lat] },
        },
      })
      map.addLayer({
        id: 'user-marker-layer',
        type: 'circle',
        source: 'user-marker',
        paint: {
          'circle-radius': 8,
          'circle-color': '#1d4ed8',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#faf6ef',
        },
      })
    }

    const bounds = new maplibregl.LngLatBounds()
    let hasBounds = false
    stormsRef.current.forEach((storm) => {
      for (const p of stormPoints(storm)) {
        bounds.extend(p)
        hasBounds = true
      }
    })
    if (user) {
      bounds.extend([user.lon, user.lat])
      hasBounds = true
    }
    if (hasBounds) {
      map.fitBounds(bounds, { padding: compact ? 36 : 48, maxZoom: compact ? 6 : 7 })
    }
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      bounds: PAR_BOUNDS,
      fitBoundsOptions: { padding: 24 },
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    mapRef.current = map
    map.once('load', () => drawStorms(map))

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (map.isStyleLoaded()) drawStorms(map)
    else map.once('load', () => drawStorms(map))
  }, [storms, userMarker])

  return (
    <div className="space-y-2">
      {error && (
        <p className="mb-2 border-2 border-[var(--color-stamp)] bg-[#fff5f5] px-3 py-2 text-sm font-medium text-[var(--color-stamp)]">
          {error}
        </p>
      )}
      <div
        ref={containerRef}
        className={`w-full overflow-hidden border-2 border-[var(--color-ink)] ${
          compact ? 'h-[min(36dvh,260px)]' : 'h-[min(60dvh,420px)]'
        }`}
        role="img"
        aria-label="Storm track map for the Philippines area"
      />
      {storms.length === 0 && !error && (
        <p className="text-sm font-medium text-[#5c4a38]">No storm track in the bulletin right now.</p>
      )}
    </div>
  )
}
