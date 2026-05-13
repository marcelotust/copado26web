import type { Team } from '../types/database'
import type { Status } from '../state/stickersTypes'
import {
  albumCrossed,
  isTeamComplete,
  milestoneQueueKey,
  sortNewMilestones,
  type Milestone,
} from './milestoneDetection'
import {
  appendPersistedMilestone,
  FEATURED_MILESTONE_TEAM_CODES,
  type PersistedMilestone,
} from './milestoneStorage'

type RefBundle = {
  seeded: { current: boolean }
  prevAlbumRatio: { current: number | null }
  prevTeamComplete: { current: Record<string, boolean> | null }
  firedKeys: { current: Set<string> }
}

type Ctx = {
  status: Status
  albumTotal: number
  albumCollected: number
  featuredProgress: Record<string, { collected: number; total: number }>
  teams: Team[]
  t: (key: string) => string
  userId: string
}

export function computeFeaturedTeamsProgress(
  byTeam: Map<string, string[]>,
  quantities: Map<string, number>,
): Record<string, { collected: number; total: number }> {
  const out: Record<string, { collected: number; total: number }> = {}
  for (const code of FEATURED_MILESTONE_TEAM_CODES) {
    const ids = byTeam.get(code) ?? []
    let collected = 0
    for (const id of ids) if ((quantities.get(id) ?? 0) >= 1) collected++
    out[code] = { collected, total: ids.length }
  }
  return out
}

/** Returns new milestones to queue (already persisted). */
export function detectMilestoneTransitions(refs: RefBundle, ctx: Ctx): Milestone[] {
  if (ctx.status !== 'ready' || ctx.albumTotal <= 0) return []

  const nextRatio = ctx.albumCollected / ctx.albumTotal
  const nextTeamComplete: Record<string, boolean> = {}
  for (const code of FEATURED_MILESTONE_TEAM_CODES) {
    const { collected, total } = ctx.featuredProgress[code] ?? { collected: 0, total: 0 }
    nextTeamComplete[code] = isTeamComplete(collected, total)
  }

  if (!refs.seeded.current) {
    refs.prevAlbumRatio.current = nextRatio
    refs.prevTeamComplete.current = nextTeamComplete
    refs.seeded.current = true
    return []
  }

  const prevRatio = refs.prevAlbumRatio.current ?? 0
  const prevTeams = refs.prevTeamComplete.current ?? {}

  const albumHits = albumCrossed(prevRatio, nextRatio).filter((pct) => !refs.firedKeys.current.has(`album:${pct}`))
  const teamHits: string[] = []
  for (const code of FEATURED_MILESTONE_TEAM_CODES) {
    const was = prevTeams[code] ?? false
    const now = nextTeamComplete[code] ?? false
    if (!was && now && !refs.firedKeys.current.has(`team:${code}`)) teamHits.push(code)
  }

  refs.prevAlbumRatio.current = nextRatio
  refs.prevTeamComplete.current = nextTeamComplete

  if (albumHits.length === 0 && teamHits.length === 0) return []

  const enriched = sortNewMilestones(albumHits, teamHits).map((m) => {
    if (m.kind === 'album') return m
    const tm = ctx.teams.find((x) => x.code === m.teamCode)
    return {
      kind: 'team' as const,
      teamCode: m.teamCode,
      flag: tm?.flag ?? '🏳️',
      name: tm ? ctx.t(tm.name_key) : m.teamCode,
    }
  })

  const ts = Date.now()
  const toAdd: Milestone[] = []
  for (const m of enriched) {
    const k = milestoneQueueKey(m)
    if (refs.firedKeys.current.has(k)) continue
    refs.firedKeys.current.add(k)
    const entry: PersistedMilestone =
      m.kind === 'album' ? { kind: 'album', pct: m.pct, at: ts } : { kind: 'team', teamCode: m.teamCode, at: ts }
    appendPersistedMilestone(ctx.userId, entry)
    toAdd.push(m)
  }
  return toAdd
}
