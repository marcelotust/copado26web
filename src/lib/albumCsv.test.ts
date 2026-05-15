import { describe, expect, it } from 'vitest'
import type { CatalogSticker } from '../types/database'
import {
  ALBUM_CSV_HEADER,
  buildAlbumCsv,
  diffQuantityMaps,
  parseAlbumCsv,
  splitCsvLines,
  validateAlbumCsvAgainstCatalog,
} from './albumCsv'

function sampleCatalog(): Map<string, CatalogSticker> {
  const a: CatalogSticker = {
    id: 'BRA-01',
    team_code: 'BRA',
    number: 1,
    player_name: 'Neymar',
    is_special: false,
    sort_order: 1,
  }
  const b: CatalogSticker = {
    id: 'BRA-02',
    team_code: 'BRA',
    number: 2,
    player_name: 'Comma, Name',
    is_special: false,
    sort_order: 2,
  }
  return new Map([
    [a.id, a],
    [b.id, b],
  ])
}

describe('albumCsv', () => {
  it('round-trips export → parse → validate', () => {
    const catalog = sampleCatalog()
    const quantities = new Map<string, number>([['BRA-01', 2]])
    const csv = buildAlbumCsv(catalog, quantities)
    expect(csv.startsWith(ALBUM_CSV_HEADER)).toBe(true)
    const parsed = parseAlbumCsv(csv)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const v = validateAlbumCsvAgainstCatalog(parsed.rows, catalog)
    expect(v.ok).toBe(true)
    if (!v.ok) return
    expect(v.quantities.get('BRA-01')).toBe(2)
    expect(v.quantities.has('BRA-02')).toBe(false)
  })

  it('parses quoted labels with commas', () => {
    const catalog = sampleCatalog()
    const line = 'BRA-02,BRA,2,"Comma, Name",1,false'
    const csv = [ALBUM_CSV_HEADER, line].join('\n')
    const parsed = parseAlbumCsv(csv)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.rows[0]?.label).toBe('Comma, Name')
    const v = validateAlbumCsvAgainstCatalog(parsed.rows, catalog)
    expect(v.ok).toBe(true)
  })

  it('rejects bad header', () => {
    const r = parseAlbumCsv('wrong\na,b')
    expect(r.ok).toBe(false)
  })

  it('diffQuantityMaps aggregates deltas', () => {
    const from = new Map([['a', 1], ['b', 2]])
    const to = new Map([['a', 3], ['b', 1]])
    const d = diffQuantityMaps(from, to)
    expect(d.changedIds).toBe(2)
    expect(d.unitsAdded).toBe(2)
    expect(d.unitsRemoved).toBe(1)
  })

  it('splitCsvLines strips BOM', () => {
    const lines = splitCsvLines(`\uFEFF${ALBUM_CSV_HEADER}\nx`)
    expect(lines[0]).toBe(ALBUM_CSV_HEADER)
  })
})
