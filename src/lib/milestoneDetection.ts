import type { Team } from '../types/database'
import type { PersistedMilestone } from './milestoneStorage'

export type Milestone =
  | { kind: 'team'; teamCode: string; flag: string; name: string }
  | { kind: 'album'; pct: 25 | 50 | 75 | 100 }

const ALBUM_THRESHOLDS = [25, 50, 75, 100] as const

export function albumCrossed(
  prevRatio: number,
  nextRatio: number,
): (typeof ALBUM_THRESHOLDS)[number][] {
  const out: (typeof ALBUM_THRESHOLDS)[number][] = []
  for (const p of ALBUM_THRESHOLDS) {
    const t = p / 100
    if (prevRatio < t && nextRatio >= t) out.push(p)
  }
  return out
}

export function isTeamComplete(collected: number, total: number): boolean {
  return total > 0 && collected >= total
}

export function hydrateMilestone(
  e: PersistedMilestone,
  teams: Team[],
  t: (key: string) => string,
): Milestone {
  if (e.kind === 'album') return { kind: 'album', pct: e.pct }
  const tm = teams.find((x) => x.code === e.teamCode)
  return {
    kind: 'team',
    teamCode: e.teamCode,
    flag: tm?.flag ?? '🏳️',
    name: tm ? t(tm.name_key) : e.teamCode,
  }
}

export function sortNewMilestones(
  albumPcts: (typeof ALBUM_THRESHOLDS)[number][],
  teamCodes: string[],
): Milestone[] {
  const album: Milestone[] = albumPcts.map((pct) => ({ kind: 'album' as const, pct }))
  const teams: Milestone[] = teamCodes.map((teamCode) => ({
    kind: 'team' as const,
    teamCode,
    flag: '',
    name: '',
  }))
  return [...album, ...teams]
}

export function milestoneQueueKey(m: Milestone): string {
  return m.kind === 'album' ? `album:${m.pct}` : `team:${m.teamCode}`
}
