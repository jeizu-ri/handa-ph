import type { SignalLevel } from './types'

export const TCWS_INFO: Record<
  SignalLevel,
  { label: string; winds: string; bg: string; text: string; border: string }
> = {
  0: {
    label: 'No wind signal',
    winds: '—',
    bg: 'bg-slate-800',
    text: 'text-slate-200',
    border: 'border-slate-600',
  },
  1: {
    label: 'TCWS #1',
    winds: '39–61 km/h',
    bg: 'bg-yellow-500',
    text: 'text-yellow-950',
    border: 'border-yellow-600',
  },
  2: {
    label: 'TCWS #2',
    winds: '62–88 km/h',
    bg: 'bg-orange-500',
    text: 'text-orange-950',
    border: 'border-orange-600',
  },
  3: {
    label: 'TCWS #3',
    winds: '89–117 km/h',
    bg: 'bg-red-500',
    text: 'text-white',
    border: 'border-red-700',
  },
  4: {
    label: 'TCWS #4',
    winds: '118–184 km/h',
    bg: 'bg-purple-600',
    text: 'text-white',
    border: 'border-purple-800',
  },
  5: {
    label: 'TCWS #5',
    winds: '≥185 km/h',
    bg: 'bg-fuchsia-700',
    text: 'text-white',
    border: 'border-fuchsia-900',
  },
}

export function normalizeSignalLevel(level: number | null | undefined): SignalLevel {
  if (level == null || level < 1) return 0
  if (level > 5) return 5
  return level as SignalLevel
}

export const PAGASA_BULLETIN_URL =
  'https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin'
export const PAGASA_TCB_ARCHIVE = 'https://pubfiles.pagasa.dost.gov.ph/tamss/weather/bulletin/'
