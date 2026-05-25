import { describe, expect, it } from 'vitest'
import { decodeAlbumBitmap, encodeAlbumBitmap } from './albumBitmap'

// A small canonical catalog order for the tests.
const ORDER = ['BRA-01', 'BRA-02', 'BRA-03', 'ARG-01', 'ARG-02', 'ESP-01', 'ESP-02', 'FRA-01', 'FRA-02']

function qty(entries: Record<string, number>): Map<string, number> {
  return new Map(Object.entries(entries))
}

describe('albumBitmap', () => {
  it('round-trips swaps (qty>1) and missing (qty=0)', () => {
    const quantities = qty({ 'BRA-01': 0, 'BRA-02': 1, 'BRA-03': 3, 'ARG-01': 2, 'ESP-02': 0 })
    // BRA-01, ESP-02 missing (and everything not listed defaults to 0 = missing).
    // BRA-03, ARG-01 are spares.
    const encoded = encodeAlbumBitmap(ORDER, quantities)
    const decoded = decodeAlbumBitmap(encoded, ORDER)

    expect(decoded.status).toBe('ok')
    if (decoded.status !== 'ok') return
    expect(decoded.swaps.sort()).toEqual(['ARG-01', 'BRA-03'])
    // Missing = every id with qty 0 (explicit or defaulted).
    expect(decoded.missing).toContain('BRA-01')
    expect(decoded.missing).toContain('ESP-02')
    expect(decoded.missing).toContain('ARG-02') // defaulted to 0
    expect(decoded.missing).not.toContain('BRA-02') // have one
    expect(decoded.missing).not.toContain('BRA-03') // spare
  })

  it('starts with the mab: prefix and stays QR-sized', () => {
    const big = new Map<string, number>()
    const bigOrder = Array.from({ length: 994 }, (_, i) => `C-${i}`)
    bigOrder.forEach((id, i) => big.set(id, i % 3))
    const encoded = encodeAlbumBitmap(bigOrder, big)
    expect(encoded.startsWith('mab:')).toBe(true)
    expect(encoded.length).toBeLessThan(600) // well under QR byte capacity
  })

  it('flags a divergent catalog (different length) as version_mismatch', () => {
    const encoded = encodeAlbumBitmap(ORDER, qty({ 'BRA-03': 2 }))
    expect(decodeAlbumBitmap(encoded, ORDER.slice(0, 5)).status).toBe('version_mismatch')
  })

  it('flags a divergent catalog (same length, different ids) as version_mismatch', () => {
    const encoded = encodeAlbumBitmap(ORDER, qty({ 'BRA-03': 2 }))
    const shuffled = [...ORDER.slice(0, -1), 'ZZZ-99']
    expect(decodeAlbumBitmap(encoded, shuffled).status).toBe('version_mismatch')
  })

  it('rejects non-album strings as invalid', () => {
    expect(decodeAlbumBitmap('https://meualbum2026.app/u/joao', ORDER).status).toBe('invalid')
    expect(decodeAlbumBitmap('mab:@@@notbase64@@@', ORDER).status).not.toBe('ok')
    expect(decodeAlbumBitmap('', ORDER).status).toBe('invalid')
  })
})
