import { describe, expect, it } from 'vitest'
import type { Team } from '../types/database'
import type { Challenge } from '../data/challenges'
import { resolveChallengeProgress } from './challengeResolve'

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
  team('ENG', 'UEFA', 'A'),
]
const BY_TEAM = new Map<string, string[]>([
  ['BRA', ['BRA-01', 'BRA-02']],
  ['ARG', ['ARG-01', 'ARG-02']],
  ['ENG', ['ENG-01', 'ENG-02']],
])

describe('resolveChallengeProgress (dispatch)', () => {
  it('routes albumTotal challenges', () => {
    const c: Challenge = {
      id: 't', icon: '', title: '', description: '',
      difficulty: 'easy', albumTotal: true, requiredQty: 10,
    }
    expect(resolveChallengeProgress(c, TEAMS, BY_TEAM, new Map(), 7))
      .toEqual({ owned: 7, total: 10 })
  })

  it('routes confGroups challenges', () => {
    const c: Challenge = {
      id: 't', icon: '', title: '', description: '',
      difficulty: 'medium', confGroups: [['CONMEBOL'], ['UEFA']],
      requiredQty: 1,
    }
    const qty = new Map([['BRA-01', 1]])
    expect(resolveChallengeProgress(c, TEAMS, BY_TEAM, qty, 0))
      .toEqual({ owned: 1, total: 2 })
  })

  it('routes confs challenges', () => {
    const c: Challenge = {
      id: 't', icon: '', title: '', description: '',
      difficulty: 'medium', confs: ['CONMEBOL'], requiredQty: 1, perTeam: true,
    }
    const qty = new Map([['BRA-01', 1], ['ARG-01', 1]])
    expect(resolveChallengeProgress(c, TEAMS, BY_TEAM, qty, 0))
      .toEqual({ owned: 2, total: 2 })
  })

  it('routes groupLetter challenges', () => {
    const c: Challenge = {
      id: 't', icon: '', title: '', description: '',
      difficulty: 'easy', groupLetter: 'A', requiredQty: 1, perTeam: true,
    }
    const qty = new Map([['BRA-01', 1]])
    expect(resolveChallengeProgress(c, TEAMS, BY_TEAM, qty, 0))
      .toEqual({ owned: 1, total: 2 })
  })

  it('routes teamCode challenges', () => {
    const c: Challenge = {
      id: 't', icon: '', title: '', description: '',
      difficulty: 'hard', teamCode: 'BRA', requiredQty: 'all',
    }
    const qty = new Map([['BRA-01', 1], ['BRA-02', 1]])
    expect(resolveChallengeProgress(c, TEAMS, BY_TEAM, qty, 0))
      .toEqual({ owned: 2, total: 2 })
  })

  it('routes targetIds challenges', () => {
    const c: Challenge = {
      id: 't', icon: '', title: '', description: '',
      difficulty: 'medium', targetIds: ['BRA-01', 'ARG-01'], requiredQty: 2,
    }
    const qty = new Map([['BRA-01', 1]])
    expect(resolveChallengeProgress(c, TEAMS, BY_TEAM, qty, 0))
      .toEqual({ owned: 1, total: 2 })
  })

  it('falls through to a zero result when no resolution kind matches', () => {
    const c = {
      id: 't', icon: '', title: '', description: '',
      difficulty: 'easy', requiredQty: 1,
    } as Challenge
    expect(resolveChallengeProgress(c, TEAMS, BY_TEAM, new Map(), 0))
      .toEqual({ owned: 0, total: 1 })
  })
})

describe('resolveChallengeProgress (real catalog challenges)', () => {
  it('group-a-taste completes when all four group A teams have a sticker', () => {
    const teams: Team[] = [
      team('CAN', 'CONCACAF', 'A'),
      team('USA', 'CONCACAF', 'A'),
      team('MEX', 'CONCACAF', 'A'),
      team('BRA', 'CONMEBOL', 'A'),
    ]
    const byTeam = new Map<string, string[]>([
      ['CAN', ['CAN-01']],
      ['USA', ['USA-01']],
      ['MEX', ['MEX-01']],
      ['BRA', ['BRA-01']],
    ])
    const c: Challenge = {
      id: 'group-a-taste', icon: '', title: '', description: '',
      difficulty: 'easy', groupLetter: 'A', requiredQty: 1, perTeam: true,
    }
    const qty = new Map([
      ['CAN-01', 1], ['USA-01', 1], ['MEX-01', 1], ['BRA-01', 1],
    ])
    expect(resolveChallengeProgress(c, teams, byTeam, qty, 0))
      .toEqual({ owned: 4, total: 4 })
  })
})
