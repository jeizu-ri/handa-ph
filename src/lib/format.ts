const MANILA = 'Asia/Manila'

export function formatManilaDateTime(iso?: string | null): string {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('en-PH', {
      timeZone: MANILA,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}
