/** Common Philippine places for quick lookup (PSGC names as used by PAGASA). */
export const SUGGESTED_LOCATIONS = [
  'Metro Manila',
  'Quezon City',
  'Manila',
  'Cebu City',
  'Davao City',
  'Iloilo City',
  'Baguio City',
  'Batanes',
  'Cagayan',
  'Isabela',
  'Bulacan',
  'Pampanga',
  'Batangas',
  'Laguna',
  'Cavite',
  'Albay',
  'Leyte',
  'Palawan',
  'Zamboanga City',
  'General Santos City',
] as const

export function filterLocations(query: string, limit = 8): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...SUGGESTED_LOCATIONS].slice(0, limit)
  return SUGGESTED_LOCATIONS.filter((name) => name.toLowerCase().includes(q)).slice(0, limit)
}
