import { beforeEach, describe, expect, it } from 'vitest'
import type { Team } from '../types/database'
import {
  computeFeaturedTeamsProgress,
  detectMilestoneTransitions,
} from './milestoneDetectorSync'
import { FEATURED_MILESTONE_TEAM_CODES, loadPersistedMilestones } from './milestoneStorage'

function team(code: string): Team {
  return {
    code, name_key: `team.${code.toLowerCase()}`,
    flag: '🏳️', conf: 'X', group_letter: null, sort_order: 0,
  }
}

const TEAMS: Team[] = FEATURED_MILESTONE_TEAM_CODES.map((c) => team(c))

function makeRefs() {
  return {
    seeded: { current: false },
    prevAlbumRatio: { current: null as number | null },
    prevTeamComplete: { current: null as Record<string, boolean> | null },
    firedKeys: { current: new Set<string>() },
  }
}

const t = (k: string) => k

const FEATURED_ZERO = Object.fromEntries(
  FEATURED_MILESTONE_TEAM_CODES.map((c) => [c, { collected: 0, total: 18 }]),
) as Record<string, { collected: number; total: number }>

const FEATURED_BRA_COMPLETE = {
  ...FEATURED_ZERO,
  BRA: { collected: 18, total: 18 },
}

describe('computeFeaturedTeamsProgress', () => {
  it('computes collected/total for every featured team', () => {
    const byTeam = new Map<string, string[]>([
      ['BRA', ['BRA-01', 'BRA-02']],
      ['ARG', ['ARG-01']],
    ])
    const qty = new Map([['BRA-01', 1], ['BRA-02', 1]])
    const out = computeFeaturedTeamsProgress(byTeam, qty)
    expect(out.BRA).toEqual({ collected: 2, total: 2 })
    expect(out.ARG).toEqual({ collected: 0, total: 1 })
    // Teams not in byTeam are still in the result with zeros.
    expect(out.USA).toEqual({ collected: 0, total: 0 })
  })
})

describe('detectMilestoneTransitions', () => {
  const userId = 'u1'

  beforeEach(() => {
    localStorage.clear()
  })

  it('returns nothing while stickers are still loading', () => {
    const refs = makeRefs()
    const out = detectMilestoneTransitions(refs, {
      status: 'loading' as const,
      albumTotal: 1000,
      albumCollected: 250,
      featuredProgress: FEATURED_ZERO,
      teams: TEAMS,
      t, userId,
    })
    expect(out).toEqual([])
    expect(refs.seeded.current).toBe(false) // seeding deferred too
  })

  it('returns nothing when album has zero total', () => {
    const refs = makeRefs()
    const out = detectMilestoneTransitions(refs, {
      status: 'ready' as const,
      albumTotal: 0,
      albumCollected: 0,
      featuredProgress: FEATURED_ZERO,
      teams: TEAMS,
      t, userId,
    })
    expect(out).toEqual([])
  })

  it('seeds baseline silently on first ready call', () => {
    const refs = makeRefs()
    const out = detectMilestoneTransitions(refs, {
      status: 'ready' as const,
      albumTotal: 1000,
      albumCollected: 600, // already past 25% and 50%
      featuredProgress: FEATURED_BRA_COMPLETE, // BRA already complete
      teams: TEAMS,
      t, userId,
    })
    expect(out).toEqual([])
    expect(refs.seeded.current).toBe(true)
    expect(refs.prevAlbumRatio.current).toBeCloseTo(0.6)
    expect(refs.prevTeamComplete.current?.BRA).toBe(true)
  })

  it('fires album milestone after seeded baseline', () => {
    const refs = makeRefs()
    const ctxBase = {
      status: 'ready' as const,
      albumTotal: 1000,
      featuredProgress: FEATURED_ZERO,
      teams: TEAMS,
      t, userId,
    }
    detectMilestoneTransitions(refs, { ...ctxBase, albumCollected: 240 })
    const out = detectMilestoneTransitions(refs, { ...ctxBase, albumCollected: 260 })
    expect(out).toHaveLength(1)
    expect(out[0]).toEqual({ kind: 'album', pct: 25 })
    // Persisted to storage so refresh doesn't refire.
    expect(loadPersistedMilestones(userId)).toHaveLength(1)
  })

  it('fires team milestone when featured team completes', () => {
    const refs = makeRefs()
    const ctxBase = {
      status: 'ready' as const,
      albumTotal: 1000,
      teams: TEAMS,
      t, userId,
    }
    // Seed
    detectMilestoneTransitions(refs, {
      ...ctxBase, albumCollected: 0, featuredProgress: FEATURED_ZERO,
    })
    const out = detectMilestoneTransitions(refs, {
      ...ctxBase, albumCollected: 18, featuredProgress: FEATURED_BRA_COMPLETE,
    })
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ kind: 'team', teamCode: 'BRA' })
  })

  it('does not re-fire a milestone already in firedKeys', () => {
    const refs = makeRefs()
    refs.firedKeys.current.add('album:25')
    const ctxBase = {
      status: 'ready' as const,
      albumTotal: 1000,
      featuredProgress: FEATURED_ZERO,
      teams: TEAMS,
      t, userId,
    }
    detectMilestoneTransitions(refs, { ...ctxBase, albumCollected: 240 })
    const out = detectMilestoneTransitions(refs, { ...ctxBase, albumCollected: 260 })
    expect(out).toEqual([])
  })

  it('orders album milestones before team milestones in a single update', () => {
    const refs = makeRefs()
    const ctxBase = {
      status: 'ready' as const,
      albumTotal: 100,
      teams: TEAMS,
      t, userId,
    }
    detectMilestoneTransitions(refs, {
      ...ctxBase, albumCollected: 0, featuredProgress: FEATURED_ZERO,
    })
    const out = detectMilestoneTransitions(refs, {
      ...ctxBase, albumCollected: 30, featuredProgress: FEATURED_BRA_COMPLETE,
    })
    expect(out.map((m) => (m.kind === 'album' ? `album:${m.pct}` : `team:${m.teamCode}`)))
      .toEqual(['album:25', 'team:BRA'])
  })
})
