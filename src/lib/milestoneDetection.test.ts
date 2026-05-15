import { describe, expect, it } from 'vitest'
import type { Team } from '../types/database'
import {
  albumCrossed,
  hydrateMilestone,
  isTeamComplete,
  milestoneQueueKey,
  sortNewMilestones,
} from './milestoneDetection'

describe('albumCrossed', () => {
  it('detects each 25% threshold crossed exactly once', () => {
    expect(albumCrossed(0, 0.3)).toEqual([25])
    expect(albumCrossed(0.3, 0.55)).toEqual([50])
    expect(albumCrossed(0.55, 0.78)).toEqual([75])
    expect(albumCrossed(0.78, 1)).toEqual([100])
  })

  it('returns multiple thresholds when crossed in a single update', () => {
    expect(albumCrossed(0, 1)).toEqual([25, 50, 75, 100])
    expect(albumCrossed(0.2, 0.6)).toEqual([25, 50])
  })

  it('returns empty when no threshold is crossed', () => {
    expect(albumCrossed(0.26, 0.49)).toEqual([])
    expect(albumCrossed(0.5, 0.5)).toEqual([])
  })

  it('does not fire when prev is already at or past the threshold', () => {
    // Regression: prevents the seed-baseline from re-firing on next render.
    expect(albumCrossed(0.25, 0.3)).toEqual([])
    expect(albumCrossed(1, 1)).toEqual([])
  })

  it('does not fire when collection goes backwards', () => {
    expect(albumCrossed(0.6, 0.2)).toEqual([])
  })

  it('fires when nextRatio lands exactly on threshold', () => {
    expect(albumCrossed(0.2, 0.25)).toEqual([25])
  })
})

describe('isTeamComplete', () => {
  it('true only when collected >= total and total > 0', () => {
    expect(isTeamComplete(18, 18)).toBe(true)
    expect(isTeamComplete(20, 18)).toBe(true)
    expect(isTeamComplete(17, 18)).toBe(false)
    expect(isTeamComplete(0, 0)).toBe(false)
  })
})

describe('milestoneQueueKey', () => {
  it('stable key per kind', () => {
    expect(milestoneQueueKey({ kind: 'album', pct: 50 })).toBe('album:50')
    expect(milestoneQueueKey({ kind: 'team', teamCode: 'BRA', flag: '', name: '' }))
      .toBe('team:BRA')
  })
})

describe('sortNewMilestones', () => {
  it('emits album entries before team entries', () => {
    const out = sortNewMilestones([50, 100], ['BRA', 'ARG'])
    expect(out.map(milestoneQueueKey)).toEqual([
      'album:50', 'album:100', 'team:BRA', 'team:ARG',
    ])
  })

  it('handles empty inputs', () => {
    expect(sortNewMilestones([], [])).toEqual([])
  })
})

describe('hydrateMilestone', () => {
  const teams: Team[] = [
    { code: 'BRA', name_key: 'team.bra', flag: '🇧🇷', conf: 'CONMEBOL', group_letter: null, sort_order: 0 },
  ]
  const t = (k: string) => `(${k})`

  it('hydrates album entries verbatim', () => {
    expect(hydrateMilestone({ kind: 'album', pct: 25, at: 0 }, teams, t))
      .toEqual({ kind: 'album', pct: 25 })
  })

  it('hydrates team entries with flag and translated name', () => {
    expect(hydrateMilestone({ kind: 'team', teamCode: 'BRA', at: 0 }, teams, t))
      .toEqual({ kind: 'team', teamCode: 'BRA', flag: '🇧🇷', name: '(team.bra)' })
  })

  it('falls back gracefully when the team is unknown', () => {
    expect(hydrateMilestone({ kind: 'team', teamCode: 'XYZ', at: 0 }, teams, t))
      .toEqual({ kind: 'team', teamCode: 'XYZ', flag: '🏳️', name: 'XYZ' })
  })
})
