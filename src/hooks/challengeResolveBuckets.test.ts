import { describe, expect, it } from 'vitest'
import type { Team } from '../types/database'
import {
  resolveConfGroups,
  resolveConfs,
  resolveGroupLetter,
} from './challengeResolveBuckets'

function team(code: string, conf: string, group: string | null = null): Team {
  return {
    code,
    name_key: `team.${code}`,
    flag: '',
    conf,
    group_letter: group,
    sort_order: 0,
  }
}

const TEAMS: Team[] = [
  team('BRA', 'CONMEBOL', 'A'),
  team('ARG', 'CONMEBOL', 'B'),
  team('URU', 'CONMEBOL', 'C'),
  team('ENG', 'UEFA', 'A'),
  team('FRA', 'UEFA', 'B'),
  team('USA', 'CONCACAF', 'A'),
  team('MEX', 'CONCACAF', 'A'),
  team('JPN', 'AFC', 'D'),
  team('CMR', 'CAF', 'C'),
  team('NZL', 'OFC', 'D'),
]

const BY_TEAM = new Map<string, string[]>(
  TEAMS.map((t) => [t.code, [`${t.code}-01`, `${t.code}-02`]]),
)

describe('resolveGroupLetter', () => {
  describe('perTeam=false (all-stickers mode)', () => {
    it('counts every sticker in the group', () => {
      const qty = new Map([['BRA-01', 1], ['ENG-01', 1], ['USA-02', 1], ['MEX-01', 1]])
      // Group A teams: BRA, ENG, USA, MEX → 8 stickers total, 4 owned
      expect(resolveGroupLetter('A', 'all', false, TEAMS, BY_TEAM, qty)).toEqual({
        owned: 4,
        total: 8,
      })
    })

    it('clamps total to numeric requiredQty', () => {
      const qty = new Map([['BRA-01', 1], ['ENG-01', 1]])
      expect(resolveGroupLetter('A', 3, false, TEAMS, BY_TEAM, qty)).toEqual({
        owned: 2,
        total: 3,
      })
    })

    it('returns total=0 for unknown group', () => {
      expect(resolveGroupLetter('Z', 'all', false, TEAMS, BY_TEAM, new Map())).toEqual({
        owned: 0,
        total: 0,
      })
    })
  })

  describe('perTeam=true (one-per-team mode)', () => {
    it('counts teams with at least 1 sticker when requiredQty=1', () => {
      const qty = new Map([['BRA-01', 1], ['ENG-02', 1]])
      // Group A teams: BRA, ENG, USA, MEX → 2 teams meet the bar
      expect(resolveGroupLetter('A', 1, true, TEAMS, BY_TEAM, qty)).toEqual({
        owned: 2,
        total: 4,
      })
    })

    it('respects requiredQty>1 per team (regression: was previously ignored)', () => {
      // BRA has 2 stickers owned, ENG has 1 → only BRA satisfies requiredQty=2
      const qty = new Map([['BRA-01', 1], ['BRA-02', 1], ['ENG-01', 1]])
      expect(resolveGroupLetter('A', 2, true, TEAMS, BY_TEAM, qty)).toEqual({
        owned: 1,
        total: 4,
      })
    })

    it("requires every sticker of the team when requiredQty='all'", () => {
      // BRA fully complete, ENG only partial
      const qty = new Map([['BRA-01', 1], ['BRA-02', 1], ['ENG-01', 1]])
      expect(resolveGroupLetter('A', 'all', true, TEAMS, BY_TEAM, qty)).toEqual({
        owned: 1,
        total: 4,
      })
    })
  })
})

describe('resolveConfs', () => {
  it('aggregates stickers across confederations (perTeam=false)', () => {
    const qty = new Map([['BRA-01', 1], ['ARG-01', 1], ['URU-02', 1]])
    expect(resolveConfs(['CONMEBOL'], 'all', false, TEAMS, BY_TEAM, qty)).toEqual({
      owned: 3,
      total: 6,
    })
  })

  it('caps total by numeric requiredQty', () => {
    const qty = new Map([['BRA-01', 1], ['ARG-01', 1]])
    expect(resolveConfs(['CONMEBOL'], 5, false, TEAMS, BY_TEAM, qty)).toEqual({
      owned: 2,
      total: 5,
    })
  })

  it('counts teams meeting the per-team threshold (perTeam=true)', () => {
    const qty = new Map([['BRA-01', 1], ['ARG-01', 1]])
    expect(resolveConfs(['CONMEBOL'], 1, true, TEAMS, BY_TEAM, qty)).toEqual({
      owned: 2,
      total: 3,
    })
  })

  it("requires full team completion when requiredQty='all' (perTeam=true)", () => {
    const qty = new Map([['BRA-01', 1], ['BRA-02', 1], ['ARG-01', 1]])
    expect(resolveConfs(['CONMEBOL'], 'all', true, TEAMS, BY_TEAM, qty)).toEqual({
      owned: 1,
      total: 3,
    })
  })

  it('supports multiple confs', () => {
    const qty = new Map([['BRA-01', 1], ['JPN-01', 1]])
    expect(resolveConfs(['CONMEBOL', 'AFC'], 1, true, TEAMS, BY_TEAM, qty)).toEqual({
      owned: 2,
      total: 4,
    })
  })
})

describe('resolveConfGroups', () => {
  const slots: string[][] = [
    ['CONMEBOL', 'CONCACAF'],
    ['UEFA'],
    ['CAF'],
    ['AFC'],
    ['OFC'],
  ]

  it('returns one owned per slot satisfied', () => {
    const qty = new Map([['BRA-01', 1], ['FRA-01', 1], ['JPN-01', 1]])
    expect(resolveConfGroups(slots, TEAMS, BY_TEAM, qty)).toEqual({
      owned: 3,
      total: 5,
    })
  })

  it('all slots satisfied = complete', () => {
    const qty = new Map([
      ['BRA-01', 1],
      ['FRA-01', 1],
      ['CMR-01', 1],
      ['JPN-01', 1],
      ['NZL-01', 1],
    ])
    expect(resolveConfGroups(slots, TEAMS, BY_TEAM, qty)).toEqual({
      owned: 5,
      total: 5,
    })
  })

  it('a slot with multiple confs is satisfied by any of them', () => {
    // Slot 0 is [CONMEBOL, CONCACAF] — having a CONCACAF sticker is enough.
    const qty = new Map([['USA-01', 1]])
    const result = resolveConfGroups(slots, TEAMS, BY_TEAM, qty)
    expect(result.owned).toBe(1)
  })

  it('returns zero when nothing matches', () => {
    expect(resolveConfGroups(slots, TEAMS, BY_TEAM, new Map())).toEqual({
      owned: 0,
      total: 5,
    })
  })
})
