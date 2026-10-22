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

export function StormMap({ storms, error }: StormMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const stormsRef = useRef(storms)
  stormsRef.current = storms

  const drawStorms = (map: maplibregl.Map) => {
    if (!map.isStyleLoaded()) return

    const layers = map.getStyle()?.layers ?? []
    for (const layer of layers) {
      if (layer.id.startsWith('storm-') && map.getLayer(layer.id)) {
        map.removeLayer(layer.id)
      }
    }
    const sources = map.getStyle()?.sources ?? {}
    for (const id of Object.keys(sources)) {
      if (id.startsWith('storm-') && map.getSource(id)) {
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
  }, [storms])

  return (
    <div className="space-y-2">
      {error && (
        <p className="mb-2 border-2 border-[var(--color-stamp)] bg-[#fff5f5] px-3 py-2 text-sm font-medium text-[var(--color-stamp)]">
          {error}
        </p>
      )}
      <div
        ref={containerRef}
        className="h-[min(60dvh,420px)] w-full overflow-hidden border-2 border-[var(--color-ink)]"
        role="img"
        aria-label="Storm track map for the Philippines area"
      />
      {storms.length === 0 && !error && (
        <p className="text-sm font-medium text-[#5c4a38]">No storm track in the bulletin right now.</p>
      )}
    </div>
  )
}
