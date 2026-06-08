import { describe, expect, it } from 'vitest'
import { analyzeTradeListPaste, parseTradeList } from './tradeListParse'

const TEAMS = new Set(['BRA', 'ESP', 'FWC', 'WAP'])

describe('parseTradeList', () => {
  it('parses space and hyphen separators', () => {
    expect(parseTradeList('BRA 03 · ESP-12 FRA 7')).toEqual(['BRA-03', 'ESP-12', 'FRA-07'])
  })

  it('ignores share headline and URL noise', () => {
    const paste = `Tenho 3 sobras no Meu Álbum 2026
https://www.meualbum2026.app

🇧🇷 Brasil (2)
BRA 01 · BRA 13`
    expect(parseTradeList(paste)).toEqual(['BRA-01', 'BRA-13'])
  })

  it('parses swap share duplicate suffix', () => {
    expect(parseTradeList('BRA 03 ×2 · ESP 01')).toEqual(['BRA-03', 'ESP-01'])
  })

  it('returns empty when nothing matches AAA 00 pattern', () => {
    expect(parseTradeList('só texto sem códigos')).toEqual([])
    expect(parseTradeList('BRASIL 03')).toEqual([])
    expect(parseTradeList('BRA123')).toEqual([])
  })

  describe('FWC 00-08 alias (seção Abertura)', () => {
    it('maps FWC 00-08 tokens to WAP equivalents', () => {
      expect(parseTradeList('FWC 00 · FWC 05 · FWC 08')).toEqual(['WAP-00', 'WAP-05', 'WAP-08'])
    })

    it('does not remap FWC 09 and above', () => {
      expect(parseTradeList('FWC 09 · FWC 19')).toEqual(['FWC-09', 'FWC-19'])
    })

    it('handles mixed FWC: alias tokens alongside real catalog tokens', () => {
      expect(parseTradeList('FWC 01 · FWC 09')).toEqual(['WAP-01', 'FWC-09'])
    })
  })
})

describe('analyzeTradeListPaste', () => {
  it('flags empty parse as noCodesFound', () => {
    const r = analyzeTradeListPaste('oi, troco tudo', TEAMS)
    expect(r.noCodesFound).toBe(true)
    expect(r.ids).toEqual([])
  })

  it('flags unknown team codes', () => {
    const r = analyzeTradeListPaste('XYZ 01 · BRA 02', TEAMS)
    expect(r.noCodesFound).toBe(false)
    expect(r.ids).toEqual(['XYZ-01', 'BRA-02'])
    expect(r.unknownTeamCodes).toEqual(['XYZ'])
  })

  it('detects paste from app share', () => {
    const r = analyzeTradeListPaste('me faltam 5 figurinhas\nBRA 01', TEAMS)
    expect(r.fromAppShare).toBe(true)
    expect(r.ids).toEqual(['BRA-01'])
  })

  describe('kind classification', () => {
    it('classifies the missing share as the friend needs (feeds -1)', () => {
      expect(analyzeTradeListPaste('me faltam 5 figurinhas\nBRA 01', TEAMS).kind).toBe('missing')
    })

    it('classifies the swaps share as the friend has spare (feeds +1)', () => {
      expect(analyzeTradeListPaste('tenho 3 repetidas para trocar\nBRA 03', TEAMS).kind).toBe('swaps')
      expect(analyzeTradeListPaste('Tenho 3 sobras\nESP 01', TEAMS).kind).toBe('swaps')
    })

    it('falls back to unknown for manual lists or mixed markers', () => {
      expect(analyzeTradeListPaste('BRA 03 · ESP 01', TEAMS).kind).toBe('unknown')
      expect(analyzeTradeListPaste('faltam: BRA 01 / repetidas: ESP 02', TEAMS).kind).toBe('unknown')
    })
  })
})
