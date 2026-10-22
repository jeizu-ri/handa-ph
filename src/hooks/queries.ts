import { useQuery } from '@tanstack/react-query'
import {
  fetchActiveCyclones,
  fetchSignalLookup,
  fetchSignalsCurrent,
  fetchStorms,
} from '../lib/api-client'

const FIVE_MIN = 5 * 60 * 1000

export function useActiveCyclones() {
  return useQuery({
    queryKey: ['cyclones', 'active'],
    queryFn: fetchActiveCyclones,
    refetchInterval: FIVE_MIN,
    refetchIntervalInBackground: false,
    staleTime: 60_000,
  })
}

export function useSignalsCurrent() {
  return useQuery({
    queryKey: ['signals', 'current'],
    queryFn: fetchSignalsCurrent,
    refetchInterval: FIVE_MIN,
    refetchIntervalInBackground: false,
    staleTime: 60_000,
  })
}

export function useSignalLookup(location: string) {
  return useQuery({
    queryKey: ['signals', 'lookup', location],
    queryFn: () => fetchSignalLookup(location),
    enabled: location.trim().length > 0,
    refetchInterval: FIVE_MIN,
    refetchIntervalInBackground: false,
    staleTime: 60_000,
  })
}

export function useStorms() {
  return useQuery({
    queryKey: ['storms'],
    queryFn: fetchStorms,
    refetchInterval: FIVE_MIN,
    refetchIntervalInBackground: false,
    staleTime: 60_000,
    retry: 1,
  })
}
