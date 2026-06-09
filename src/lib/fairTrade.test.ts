import { describe, expect, it } from 'vitest'
import type { CatalogSticker } from '../types/database'
import { classifySticker, partitionByFairness } from './fairTrade'

function row(id: string, opts: Partial<CatalogSticker> = {}): CatalogSticker {
  const [team_code, numStr] = id.split('-')
  return {
    id,
    team_code,
    number: parseInt(numStr, 10),
    player_name: null,
    is_special: false,
    sort_order: 0,
    ...opts,
  }
}

function makeCatalog(rows: CatalogSticker[]): Map<string, CatalogSticker> {
  return new Map(rows.map(r => [r.id, r]))
}

const C = makeCatalog([
  // foils
  row('WAP-00', { is_special: true }),
  row('BRA-01', { is_special: true }),
  row('CUW-01', { is_special: true }),
  row('FRA-01', { is_special: true }),
  // special edition
  row('FWC-09', { is_special: true }),
  row('CC-01', { is_special: true }),
  // stars
  row('ARG-17', { player_name: 'Lionel Messi' }),
  row('FRA-20', { player_name: 'Kylian Mbappé' }),
  row('POR-15', { player_name: 'Cristiano Ronaldo' }),
  // regulars
  row('BRA-05', { player_name: 'Éder Militão' }),  // tier S
  row('FRA-05', { player_name: 'Jules Koundé' }),  // tier S
  row('JPN-05', { player_name: 'X' }),             // tier A
  row('IRN-05', { player_name: 'X' }),             // tier B
  row('UZB-05', { player_name: 'X' }),             // tier C
  row('HAI-05', { player_name: 'X' }),             // tier D
  row('CUW-05', { player_name: 'X' }),             // tier D
])

describe('classifySticker', () => {
  it('reconhece foil de escudo de seleção', () => {
    expect(classifySticker('BRA-01', C)).toEqual({ kind: 'foil' })
    expect(classifySticker('CUW-01', C)).toEqual({ kind: 'foil' })
  })

  it('reconhece foil da abertura (WAP)', () => {
    expect(classifySticker('WAP-00', C)).toEqual({ kind: 'foil' })
  })

  it('reconhece seção especial (FWC e CC)', () => {
    expect(classifySticker('FWC-09', C)).toEqual({ kind: 'special' })
    expect(classifySticker('CC-01', C)).toEqual({ kind: 'special' })
  })

  it('reconhece estrelas curadas', () => {
    expect(classifySticker('ARG-17', C)).toEqual({ kind: 'star' })
    expect(classifySticker('FRA-20', C)).toEqual({ kind: 'star' })
    expect(classifySticker('POR-15', C)).toEqual({ kind: 'star' })
  })

  it('aplica tier de seleção em cromos regulares', () => {
    expect(classifySticker('BRA-05', C)).toEqual({ kind: 'regular', teamTier: 'S' })
    expect(classifySticker('FRA-05', C)).toEqual({ kind: 'regular', teamTier: 'S' })
    expect(classifySticker('JPN-05', C)).toEqual({ kind: 'regular', teamTier: 'A' })
    expect(classifySticker('IRN-05', C)).toEqual({ kind: 'regular', teamTier: 'B' })
    expect(classifySticker('UZB-05', C)).toEqual({ kind: 'regular', teamTier: 'C' })
    expect(classifySticker('HAI-05', C)).toEqual({ kind: 'regular', teamTier: 'D' })
  })

  it('devolve unknown para IDs fora do catálogo', () => {
    expect(classifySticker('XYZ-99', C)).toEqual({ kind: 'unknown' })
  })
})

describe('partitionByFairness', () => {
  it('foil vs foil — tudo justo', () => {
    const r = partitionByFairness(['BRA-01', 'FRA-01'], ['CUW-01', 'WAP-00'], C)
    expect(r.theyHave.fair).toEqual(['BRA-01', 'FRA-01'])
    expect(r.iHave.fair).toEqual(['CUW-01', 'WAP-00'])
    expect(r.theyHave.unfair).toEqual([])
    expect(r.iHave.unfair).toEqual([])
  })

  it('estrela contra regular tier D — ambos vão para unfair', () => {
    const r = partitionByFairness(['ARG-17'], ['CUW-05'], C)
    expect(r.theyHave.fair).toEqual([])
    expect(r.iHave.fair).toEqual([])
    expect(r.theyHave.unfair).toEqual(['ARG-17'])
    expect(r.iHave.unfair).toEqual(['CUW-05'])
  })

  it('regular S ↔ regular S — fair', () => {
    const r = partitionByFairness(['BRA-05'], ['FRA-05'], C)
    expect(r.theyHave.fair).toEqual(['BRA-05'])
    expect(r.iHave.fair).toEqual(['FRA-05'])
  })

  it('regular S ↔ regular A — fair (gap 1)', () => {
    const r = partitionByFairness(['BRA-05'], ['JPN-05'], C)
    expect(r.theyHave.fair).toEqual(['BRA-05'])
    expect(r.iHave.fair).toEqual(['JPN-05'])
  })

  it('regular S ↔ regular B — unfair (gap 2)', () => {
    const r = partitionByFairness(['BRA-05'], ['IRN-05'], C)
    expect(r.theyHave.unfair).toEqual(['BRA-05'])
    expect(r.iHave.unfair).toEqual(['IRN-05'])
  })

  it('regular S ↔ regular D — unfair (gap 4)', () => {
    const r = partitionByFairness(['BRA-05'], ['HAI-05'], C)
    expect(r.theyHave.unfair).toEqual(['BRA-05'])
    expect(r.iHave.unfair).toEqual(['HAI-05'])
  })

  it('preserva simetria do pareamento em fixtures mistas', () => {
    const cases: Array<[string[], string[]]> = [
      [['ARG-17', 'BRA-05', 'CUW-01'], ['POR-15', 'FRA-05', 'BRA-01']],
      [['BRA-01', 'BRA-05', 'HAI-05'], ['FRA-01', 'CUW-05', 'JPN-05']],
      [['FWC-09', 'CC-01', 'ARG-17'], ['CC-01', 'BRA-14', 'POR-15']],
      [['BRA-05', 'BRA-05', 'JPN-05'], ['FRA-05', 'JPN-05', 'JPN-05']],
      [['CUW-01', 'WAP-00', 'BRA-05'], ['BRA-01', 'JPN-05', 'IRN-05']],
    ]
    for (const [a, b] of cases) {
      const r = partitionByFairness(a, b, C)
      expect(r.theyHave.fair.length).toBe(r.iHave.fair.length)
    }
  })

  it('preserva ordem original dos IDs em fair e unfair', () => {
    const r = partitionByFairness(
      ['ARG-17', 'BRA-05', 'CUW-01'],
      ['BRA-01', 'CUW-05', 'POR-15'],
      C,
    )
    // ARG-17 (star) ↔ POR-15 (star); CUW-01 (foil) ↔ BRA-01 (foil); BRA-05 sobra; CUW-05 sobra.
    expect(r.theyHave.fair).toEqual(['ARG-17', 'CUW-01'])
    expect(r.theyHave.unfair).toEqual(['BRA-05'])
    expect(r.iHave.fair).toEqual(['BRA-01', 'POR-15'])
    expect(r.iHave.unfair).toEqual(['CUW-05'])
  })

  it('pareia gap 0 antes de gap 1 (S+S+A vs S+A+A)', () => {
    // theyHave: 2× tier S (BRA-05, FRA-05) + 1× A (JPN-05)
    // iHave:    1× S (BRA-05) + 2× A (JPN-05)
    // Esperado: todos 3 casam (gap exato primeiro, depois adjacente).
    const C2 = makeCatalog([
      row('BRA-05'),
      row('FRA-05'),
      row('JPN-05'),
      row('JPN-06'),
      row('JPN-07'),
      row('BRA-06'),
    ])
    const r = partitionByFairness(
      ['BRA-05', 'FRA-05', 'JPN-05'],
      ['BRA-06', 'JPN-06', 'JPN-07'],
      C2,
    )
    expect(r.theyHave.unfair).toEqual([])
    expect(r.iHave.unfair).toEqual([])
    expect(r.theyHave.fair.length).toBe(3)
  })

  it('IDs unknown não fazem par e vão para unfair', () => {
    const r = partitionByFairness(['XYZ-01'], ['BRA-01'], C)
    expect(r.theyHave.unfair).toEqual(['XYZ-01'])
    expect(r.iHave.unfair).toEqual(['BRA-01'])
  })

  it('listas vazias devolvem partições vazias', () => {
    const r = partitionByFairness([], [], C)
    expect(r.theyHave.fair).toEqual([])
    expect(r.theyHave.unfair).toEqual([])
    expect(r.iHave.fair).toEqual([])
    expect(r.iHave.unfair).toEqual([])
  })
})
