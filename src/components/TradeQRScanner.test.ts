import { describe, expect, it } from 'vitest'
import { extractTradePath } from './TradeQRScanner'

// vitest's jsdom env exposes window.location.origin === 'http://localhost:3000'.
// Use that as the base for tests of the same-origin path.
const SAME = 'http://localhost:3000'

describe('extractTradePath', () => {
  it('extracts d param from a same-origin trade URL', () => {
    expect(extractTradePath(`${SAME}/trade?d=abc123`)).toBe('/trade?d=abc123')
  })

  it('accepts a relative /trade path', () => {
    expect(extractTradePath('/trade?d=xyz')).toBe('/trade?d=xyz')
  })

  it('re-encodes payload safely', () => {
    expect(extractTradePath(`${SAME}/trade?d=a%2Bb`)).toBe('/trade?d=a%2Bb')
  })

  it('rejects cross-origin /trade URLs (defense-in-depth)', () => {
    expect(extractTradePath('https://evil.example.com/trade?d=abc')).toBeNull()
    expect(extractTradePath('https://meualbum.app/trade?d=abc')).toBeNull()
  })

  it('rejects URLs whose path is not exactly /trade', () => {
    expect(extractTradePath(`${SAME}/missing`)).toBeNull()
    expect(extractTradePath(`${SAME}/friends/add?code=foo`)).toBeNull()
    expect(extractTradePath(`${SAME}/some/trade?d=abc`)).toBeNull()
  })

  it('rejects /trade without d param', () => {
    expect(extractTradePath(`${SAME}/trade`)).toBeNull()
  })

  it('rejects garbage input', () => {
    expect(extractTradePath('')).toBeNull()
    expect(extractTradePath('hello world')).toBeNull()
  })
})
