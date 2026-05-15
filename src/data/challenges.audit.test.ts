/**
 * Catalog-backed audit: every challenge must resolve against the seeded album.
 * Run: npm test -- src/data/challenges.audit.test.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Team } from '../types/database'
import { CHALLENGES } from './challenges'
import { resolveChallengeProgress } from '../hooks/challengeResolve'

const root = path.resolve(import.meta.dirname, '../..')

function loadCatalog() {
  const teamsSql = fs.readFileSync(
    path.join(root, 'supabase/migrations/20260512_0002_seed_teams.sql'),
    'utf8',
  )
  const catalogSql = fs.readFileSync(
    path.join(root, 'supabase/migrations/20260512_0003_seed_catalog.sql'),
    'utf8',
  )

  const teams: Team[] = []
  const teamRe =
    /\('([A-Z]{3})',\s*'([^']+)',\s*'[^']*',\s*'([^']+)',\s*(?:'([A-L])'|null),\s*(\d+)\)/g
  for (const m of teamsSql.matchAll(teamRe)) {
    teams.push({
      code: m[1],
      name_key: m[2],
      flag: '',
      conf: m[3],
      group_letter: m[4] ?? null,
      sort_order: Number(m[5]),
    })
  }

  const stickerIds = new Set<string>()
  const byTeam = new Map<string, string[]>()
  for (const m of catalogSql.matchAll(/\('([A-Z0-9]+-\d+)',\s*'([A-Z0-9]+)'/g)) {
    stickerIds.add(m[1])
    const team = m[2]
    if (!byTeam.has(team)) byTeam.set(team, [])
    byTeam.get(team)!.push(m[1])
  }

  return { teams, stickerIds, byTeam, albumTotal: stickerIds.size }
}

describe('challenges catalog audit', () => {
  const { teams, stickerIds, byTeam, albumTotal } = loadCatalog()

  it('loads the full Panini seed', () => {
    expect(teams.length).toBeGreaterThanOrEqual(48)
    expect(albumTotal).toBe(994)
  })

  it('has exactly 14 challenges', () => {
    expect(CHALLENGES).toHaveLength(14)
  })

  for (const challenge of CHALLENGES) {
    it(`${challenge.id}: valid targets and non-zero progress scale`, () => {
      if (challenge.targetIds) {
        for (const id of challenge.targetIds) {
          expect(stickerIds.has(id), `missing sticker ${id}`).toBe(true)
        }
      }
      if (challenge.teamCode) {
        expect(byTeam.has(challenge.teamCode), `unknown team ${challenge.teamCode}`).toBe(true)
      }
      if (challenge.groupLetter) {
        const inGroup = teams.filter(t => t.group_letter === challenge.groupLetter)
        expect(inGroup.length, `no teams in group ${challenge.groupLetter}`).toBeGreaterThan(0)
      }
      if (challenge.confs) {
        const inConf = teams.filter(
          t => challenge.confs!.includes(t.conf) && t.code !== 'WAP',
        )
        expect(inConf.length).toBeGreaterThan(0)
      }
      if (challenge.albumTotal && challenge.requiredQty === 497) {
        expect(Math.floor(albumTotal / 2)).toBe(497)
      }

      const empty = resolveChallengeProgress(challenge, teams, byTeam, new Map(), 0)
      expect(empty.total, 'resolution total must be > 0').toBeGreaterThan(0)
    })
  }

  it('group-a-taste uses the printed Group A (MEX · RSA · KOR · CZE)', () => {
    const c = CHALLENGES.find(ch => ch.id === 'group-a-taste')!
    const groupA = teams.filter(t => t.group_letter === 'A').map(t => t.code)
    expect(groupA).toEqual(['MEX', 'RSA', 'KOR', 'CZE'])

    const qty = new Map(
      groupA.map(code => [byTeam.get(code)![0], 1] as [string, number]),
    )
    const r = resolveChallengeProgress(c, teams, byTeam, qty, 0)
    expect(r).toEqual({ owned: 4, total: 4 })
  })

  it('host-trio completes with any sticker per host nation', () => {
    const c = CHALLENGES.find(ch => ch.id === 'host-trio')!
    const qty = new Map([['USA-02', 1], ['MEX-05', 1], ['CAN-01', 1]])
    const r = resolveChallengeProgress(c, teams, byTeam, qty, 0)
    expect(r).toEqual({ owned: 3, total: 3 })
  })

  it('oceania is NZL + AUS only (the two OFC qualifiers in this cup)', () => {
    const ofcTeams = teams.filter(t => t.conf === 'OFC' && t.code !== 'WAP')
    expect(ofcTeams.map(t => t.code)).toEqual(['NZL'])

    const c = CHALLENGES.find(ch => ch.id === 'oceania')!
    expect(c.teamCodes).toEqual(['NZL', 'AUS'])
    const qty = new Map([['NZL-02', 1], ['AUS-03', 1]])
    const r = resolveChallengeProgress(c, teams, byTeam, qty, 0)
    expect(r).toEqual({ owned: 2, total: 2 })
  })

  it('five-continents needs one conf slot per continent bucket', () => {
    const c = CHALLENGES.find(ch => ch.id === 'five-continents')!
    expect(c.confGroups).toHaveLength(5)
    const qty = new Map([
      ['BRA-01', 1],
      ['USA-01', 1],
      ['ENG-01', 1],
      ['SEN-01', 1],
      ['JPN-01', 1],
      ['NZL-01', 1],
    ])
    const r = resolveChallengeProgress(c, teams, byTeam, qty, 0)
    expect(r).toEqual({ owned: 5, total: 5 })
  })
})
