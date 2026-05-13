/** Persisted milestone events (stable ids + timestamp for “recent” ordering). */

export const FEATURED_MILESTONE_TEAM_CODES = [
  'BRA',
  'ARG',
  'FRA',
  'ENG',
  'GER',
  'POR',
  'ESP',
  'USA',
] as const

export type FeaturedMilestoneTeamCode = (typeof FEATURED_MILESTONE_TEAM_CODES)[number]

export type PersistedMilestone =
  | { kind: 'album'; pct: 25 | 50 | 75 | 100; at: number }
  | { kind: 'team'; teamCode: string; at: number }

type StoredShape = { v: 1; events: PersistedMilestone[] }

const STORAGE_PREFIX = 'meualbum2026.milestones.v1:'

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`
}

export function milestoneStorageKey(userId: string): string {
  return storageKey(userId)
}

export function persistedMilestoneKey(e: PersistedMilestone): string {
  return e.kind === 'album' ? `album:${e.pct}` : `team:${e.teamCode}`
}

export function loadPersistedMilestones(userId: string): PersistedMilestone[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredShape
    if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.events)) return []
    return parsed.events
  } catch {
    return []
  }
}

export function appendPersistedMilestone(userId: string, entry: PersistedMilestone): void {
  if (typeof localStorage === 'undefined') return
  const prev = loadPersistedMilestones(userId)
  const exists = prev.some((e) =>
    e.kind === 'album' && entry.kind === 'album'
      ? e.pct === entry.pct
      : e.kind === 'team' && entry.kind === 'team' && e.teamCode === entry.teamCode,
  )
  if (exists) return
  const next: StoredShape = { v: 1, events: [...prev, entry] }
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(next))
  } catch {
    /* quota or private mode */
  }
}
