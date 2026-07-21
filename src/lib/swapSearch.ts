import type { SwapGroup } from '../state/stickersTypes'

/** Lowercase + strip accents so "qatar" matches "Qatar" and "sao" matches "São". */
export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

/**
 * Filters swap groups by team. Matches the 3-letter team code (e.g. "BRA",
 * "QAT") and the translated team name, both case- and accent-insensitive.
 * An empty query returns the groups unchanged.
 */
export function filterSwapGroups(
  groups: SwapGroup[],
  query: string,
  teamName: (code: string) => string,
): SwapGroup[] {
  const q = normalizeSearch(query)
  if (!q) return groups
  return groups.filter(group =>
    normalizeSearch(group.teamCode).includes(q)
    || normalizeSearch(teamName(group.teamCode)).includes(q),
  )
}
