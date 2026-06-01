import { describe, expect, it } from 'vitest'
import { extractTradePath } from './TradeQRScanner'

describe('extractTradePath', () => {
  it('extracts d param from a full trade URL', () => {
    expect(extractTradePath('https://meualbum.app/trade?d=abc123')).toBe('/trade?d=abc123')
  })

  it('accepts relative /trade path', () => {
    expect(extractTradePath('/trade?d=xyz')).toBe('/trade?d=xyz')
  })

  it('encodes payload safely', () => {
    expect(extractTradePath('https://meualbum.app/trade?d=a%2Bb')).toBe('/trade?d=a%2Bb')
  })

  it('rejects non-trade URLs', () => {
    expect(extractTradePath('https://meualbum.app/missing')).toBeNull()
    expect(extractTradePath('https://meualbum.app/friends/add?code=foo')).toBeNull()
  })

  it('rejects /trade without d param', () => {
    expect(extractTradePath('https://meualbum.app/trade')).toBeNull()
  })

  it('rejects garbage input', () => {
    expect(extractTradePath('')).toBeNull()
    expect(extractTradePath('hello world')).toBeNull()
  })
})
