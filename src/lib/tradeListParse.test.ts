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
})
