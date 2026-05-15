import { beforeEach, describe, expect, it } from 'vitest'
import {
  appendPersistedMilestone,
  loadPersistedMilestones,
  milestoneStorageKey,
  persistedMilestoneKey,
} from './milestoneStorage'

const USER = 'user-test'

describe('milestoneStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns empty array when nothing has been written', () => {
    expect(loadPersistedMilestones(USER)).toEqual([])
  })

  it('appends an album milestone', () => {
    appendPersistedMilestone(USER, { kind: 'album', pct: 50, at: 1 })
    expect(loadPersistedMilestones(USER)).toEqual([
      { kind: 'album', pct: 50, at: 1 },
    ])
  })

  it('appends a team milestone', () => {
    appendPersistedMilestone(USER, { kind: 'team', teamCode: 'BRA', at: 2 })
    expect(loadPersistedMilestones(USER)).toEqual([
      { kind: 'team', teamCode: 'BRA', at: 2 },
    ])
  })

  it('is idempotent on the same album pct', () => {
    appendPersistedMilestone(USER, { kind: 'album', pct: 25, at: 1 })
    appendPersistedMilestone(USER, { kind: 'album', pct: 25, at: 9999 })
    const events = loadPersistedMilestones(USER)
    expect(events).toHaveLength(1)
    expect(events[0]).toEqual({ kind: 'album', pct: 25, at: 1 })
  })

  it('is idempotent on the same team code', () => {
    appendPersistedMilestone(USER, { kind: 'team', teamCode: 'BRA', at: 1 })
    appendPersistedMilestone(USER, { kind: 'team', teamCode: 'BRA', at: 2 })
    expect(loadPersistedMilestones(USER)).toHaveLength(1)
  })

  it('keeps separate entries for distinct keys', () => {
    appendPersistedMilestone(USER, { kind: 'album', pct: 25, at: 1 })
    appendPersistedMilestone(USER, { kind: 'team', teamCode: 'BRA', at: 2 })
    appendPersistedMilestone(USER, { kind: 'album', pct: 50, at: 3 })
    expect(loadPersistedMilestones(USER)).toHaveLength(3)
  })

  it('isolates storage per user', () => {
    appendPersistedMilestone('alice', { kind: 'album', pct: 25, at: 1 })
    appendPersistedMilestone('bob', { kind: 'album', pct: 75, at: 2 })
    expect(loadPersistedMilestones('alice')).toEqual([{ kind: 'album', pct: 25, at: 1 }])
    expect(loadPersistedMilestones('bob')).toEqual([{ kind: 'album', pct: 75, at: 2 }])
  })

  it('recovers from corrupted JSON', () => {
    localStorage.setItem(milestoneStorageKey(USER), '{ not json')
    expect(loadPersistedMilestones(USER)).toEqual([])
  })

  it('recovers from wrong schema version', () => {
    localStorage.setItem(milestoneStorageKey(USER), JSON.stringify({ v: 99, events: [] }))
    expect(loadPersistedMilestones(USER)).toEqual([])
  })

  it('persistedMilestoneKey matches milestoneQueueKey conventions', () => {
    expect(persistedMilestoneKey({ kind: 'album', pct: 25, at: 0 })).toBe('album:25')
    expect(persistedMilestoneKey({ kind: 'team', teamCode: 'BRA', at: 0 })).toBe('team:BRA')
  })
})
