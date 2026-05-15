import { describe, expect, it } from 'vitest'
import {
  resolveAlbumTotal,
  resolveTargetIds,
  resolveTeamCode,
} from './challengeResolveBasics'

describe('resolveAlbumTotal', () => {
  it('clamps owned to the required target', () => {
    expect(resolveAlbumTotal(10, 4)).toEqual({ owned: 4, total: 10 })
    expect(resolveAlbumTotal(10, 25)).toEqual({ owned: 10, total: 10 })
  })

  it('returns zero progress when collected is zero', () => {
    expect(resolveAlbumTotal(497, 0)).toEqual({ owned: 0, total: 497 })
  })

  it("defends against requiredQty='all' (invalid for albumTotal)", () => {
    // Without the guard, total would be NaN and break the progress bar.
    expect(resolveAlbumTotal('all', 50)).toEqual({ owned: 0, total: 0 })
  })

  it('treats non-positive requiredQty as zero', () => {
    expect(resolveAlbumTotal(0, 5)).toEqual({ owned: 0, total: 0 })
  })
})

describe('resolveTeamCode', () => {
  const byTeam = new Map<string, string[]>([
    ['BRA', ['BRA-01', 'BRA-02', 'BRA-03']],
    ['ARG', ['ARG-01', 'ARG-02']],
  ])

  it('counts owned stickers, capped at requiredQty', () => {
    const qty = new Map([['BRA-01', 1], ['BRA-02', 2]])
    expect(resolveTeamCode('BRA', 5, byTeam, qty)).toEqual({ owned: 2, total: 3 })
  })

  it('clamps requiredQty by team catalog size', () => {
    const qty = new Map<string, number>()
    expect(resolveTeamCode('ARG', 10, byTeam, qty)).toEqual({ owned: 0, total: 2 })
  })

  it("treats requiredQty='all' as the team's full catalog", () => {
    const qty = new Map([['BRA-01', 1], ['BRA-02', 1], ['BRA-03', 1]])
    expect(resolveTeamCode('BRA', 'all', byTeam, qty)).toEqual({ owned: 3, total: 3 })
  })

  it('returns total=0 when team is unknown', () => {
    expect(resolveTeamCode('XYZ', 5, byTeam, new Map())).toEqual({ owned: 0, total: 0 })
  })

  it('ignores duplicate quantities (quantity > 1 still counts as 1 owned)', () => {
    const qty = new Map([['BRA-01', 7]])
    expect(resolveTeamCode('BRA', 'all', byTeam, qty)).toEqual({ owned: 1, total: 3 })
  })
})

describe('resolveTargetIds', () => {
  it('counts owned ids only, capped at total', () => {
    const ids = ['ENG-01', 'FRA-01', 'GER-01']
    const qty = new Map([['ENG-01', 1], ['FRA-01', 1]])
    expect(resolveTargetIds(ids, 3, qty)).toEqual({ owned: 2, total: 3 })
  })

  it("returns owned/total when requiredQty='all'", () => {
    const ids = ['A', 'B']
    expect(resolveTargetIds(ids, 'all', new Map([['A', 1]]))).toEqual({
      owned: 1,
      total: 2,
    })
  })

  it('does not count missing ids', () => {
    const qty = new Map([['MISSING', 1]])
    expect(resolveTargetIds(['A', 'B'], 'all', qty)).toEqual({ owned: 0, total: 2 })
  })
})
