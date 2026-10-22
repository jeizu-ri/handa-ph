import { StormMap } from './StormMap'
import type { Storm } from '../lib/types'

interface NearbyStormMapProps {
  storms: Storm[]
  user?: { lat: number; lon: number } | null
  cycloneName?: string | null
}

export function NearbyStormMap({ storms, user, cycloneName }: NearbyStormMapProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-bold text-[#4a3d32]">
        {cycloneName ? `${cycloneName} is active nearby` : 'Active storm nearby'} — approximate track from PAGASA
      </p>
      <StormMap storms={storms} userMarker={user} compact />
    </div>
  )
}
