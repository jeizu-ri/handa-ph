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

export function StormMap({ storms, error }: StormMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

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

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const run = () => {
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

      storms.forEach((storm, index) => {
        const sourceId = `storm-${index}`
        const points: [number, number][] = []

        if (storm.current?.lon != null && storm.current?.lat != null) {
          points.push([storm.current.lon, storm.current.lat])
        }
        for (const p of storm.forecast ?? []) {
          if (p.lon != null && p.lat != null) points.push([p.lon, p.lat])
        }

        if (points.length === 0) return

        const lineSource = `${sourceId}-line`
        const pointSource = `${sourceId}-point`

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
          paint: { 'line-color': '#38bdf8', 'line-width': 3 },
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
            'circle-radius': 8,
            'circle-color': '#f97316',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          },
        })
      })
    }

    if (map.isStyleLoaded()) run()
    else map.once('load', run)
  }, [storms])

  return (
    <div className="space-y-2">
      {error && (
        <p className="rounded-lg border border-amber-700/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-100">
          {error}
        </p>
      )}
      <div
        ref={containerRef}
        className="h-[min(60dvh,420px)] w-full overflow-hidden rounded-xl border border-slate-700"
        role="img"
        aria-label="Storm track map for the Philippines area"
      />
      {storms.length === 0 && !error && (
        <p className="text-sm text-slate-400">No active storm tracks in the feed right now.</p>
      )}
    </div>
  )
}
