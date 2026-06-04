import { describe, expect, it } from 'vitest'
import type { CatalogSticker } from '../types/database'
import { buildPasteLookup, parsePasteText, applyPasteAdditive } from './albumPaste'

function sampleCatalog(): Map<string, CatalogSticker> {
  const stickers: CatalogSticker[] = [
    { id: 'BRA-01', team_code: 'BRA', number: 1, player_name: 'Player A', is_special: false, sort_order: 1 },
    { id: 'BRA-02', team_code: 'BRA', number: 2, player_name: 'Player B', is_special: false, sort_order: 2 },
    { id: 'MEX-05', team_code: 'MEX', number: 5, player_name: null, is_special: false, sort_order: 3 },
    { id: 'FWC-04', team_code: 'FWC', number: 4, player_name: null, is_special: true, sort_order: 4 },
  ]
  return new Map(stickers.map(s => [s.id, s]))
}

describe('buildPasteLookup', () => {
  it('indexes stickers by team_code and number', () => {
    const lookup = buildPasteLookup(sampleCatalog())
    expect(lookup.get('BRA')?.get(1)).toBe('BRA-01')
    expect(lookup.get('MEX')?.get(5)).toBe('MEX-05')
    expect(lookup.get('FWC')?.get(4)).toBe('FWC-04')
  })
})

describe('parsePasteText', () => {
  it('parses standard Panini format with commas', () => {
    const lookup = buildPasteLookup(sampleCatalog())
    const result = parsePasteText('BRA 1, 2\nMEX 5', lookup)
    expect(result.found.has('BRA-01')).toBe(true)
    expect(result.found.has('BRA-02')).toBe(true)
    expect(result.found.has('MEX-05')).toBe(true)
    expect(result.unknownCodes).toEqual([])
  })

  it('handles space-separated numbers (no commas)', () => {
    const lookup = buildPasteLookup(sampleCatalog())
    const result = parsePasteText('BRA 1 2', lookup)
    expect(result.found.has('BRA-01')).toBe(true)
    expect(result.found.has('BRA-02')).toBe(true)
  })

  it('ignores blank lines', () => {
    const lookup = buildPasteLookup(sampleCatalog())
    const result = parsePasteText('\nBRA 1\n\n', lookup)
    expect(result.found.size).toBe(1)
  })

  it('collects unknown team codes as warnings without failing', () => {
    const lookup = buildPasteLookup(sampleCatalog())
    const result = parsePasteText('BRA 1\nXXX 3\nYYY 5', lookup)
    expect(result.found.has('BRA-01')).toBe(true)
    expect(result.unknownCodes).toEqual(['XXX', 'YYY'])
  })

  it('does not duplicate unknown code warnings', () => {
    const lookup = buildPasteLookup(sampleCatalog())
    const result = parsePasteText('XXX 1\nXXX 2', lookup)
    expect(result.unknownCodes).toEqual(['XXX'])
  })

  it('returns empty found when no recognizable stickers', () => {
    const lookup = buildPasteLookup(sampleCatalog())
    const result = parsePasteText('XXX 1, 2', lookup)
    expect(result.found.size).toBe(0)
  })

  it('ignores numbers not in catalog for a known team', () => {
    const lookup = buildPasteLookup(sampleCatalog())
    const result = parsePasteText('BRA 1, 99', lookup)
    expect(result.found.has('BRA-01')).toBe(true)
    expect(result.found.size).toBe(1)
  })

  it('sets quantity to 1 for each found sticker', () => {
    const lookup = buildPasteLookup(sampleCatalog())
    const result = parsePasteText('BRA 1', lookup)
    expect(result.found.get('BRA-01')).toBe(1)
  })
})

describe('applyPasteAdditive', () => {
  it('sets new stickers to quantity 1', () => {
    const existing = new Map<string, number>()
    const found = new Map([['BRA-01', 1], ['BRA-02', 1]])
    const result = applyPasteAdditive(existing, found)
    expect(result.get('BRA-01')).toBe(1)
    expect(result.get('BRA-02')).toBe(1)
  })

  it('preserves existing quantity when higher than 1', () => {
    const existing = new Map<string, number>([['BRA-01', 3]])
    const found = new Map([['BRA-01', 1]])
    const result = applyPasteAdditive(existing, found)
    expect(result.get('BRA-01')).toBe(3)
  })

  it('keeps stickers not in found at their existing quantity', () => {
    const existing = new Map<string, number>([['MEX-05', 2]])
    const found = new Map([['BRA-01', 1]])
    const result = applyPasteAdditive(existing, found)
    expect(result.get('MEX-05')).toBe(2)
    expect(result.get('BRA-01')).toBe(1)
  })

  it('does not mutate the existing map', () => {
    const existing = new Map<string, number>([['BRA-01', 1]])
    const found = new Map([['BRA-02', 1]])
    applyPasteAdditive(existing, found)
    expect(existing.has('BRA-02')).toBe(false)
  })
})
