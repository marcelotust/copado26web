import { describe, expect, it } from 'vitest'
import { compressToEncodedURIComponent } from 'lz-string'
import {
  MAX_DECODED_JSON_LENGTH,
  MAX_TRADE_LIST_LENGTH,
  MAX_TRADE_PARAM_LENGTH,
  decodeTradePayload,
  encodeTradeSwapsOnly,
} from './tradePayload'

describe('decodeTradePayload', () => {
  it('round-trips a swaps-only link', () => {
    const encoded = encodeTradeSwapsOnly(['BRA-01', 'ARG-02'])
    expect(decodeTradePayload(encoded)).toEqual({
      swaps: ['BRA-01', 'ARG-02'],
      missing: [],
      hasPeerMissingList: false,
    })
  })

  it('decodes a payload carrying the peer missing list', () => {
    const encoded = compressToEncodedURIComponent(
      JSON.stringify({ swaps: ['BRA-01'], missing: ['ARG-02'] }),
    )
    expect(decodeTradePayload(encoded)).toEqual({
      swaps: ['BRA-01'],
      missing: ['ARG-02'],
      hasPeerMissingList: true,
    })
  })

  it('returns null for nullish or empty input', () => {
    expect(decodeTradePayload(null)).toBeNull()
    expect(decodeTradePayload(undefined)).toBeNull()
    expect(decodeTradePayload('')).toBeNull()
    expect(decodeTradePayload('   ')).toBeNull()
  })

  it('returns null when swaps is missing or not a string array', () => {
    expect(decodeTradePayload(compressToEncodedURIComponent('{}'))).toBeNull()
    expect(decodeTradePayload(compressToEncodedURIComponent('{"swaps":[1,2]}'))).toBeNull()
    expect(decodeTradePayload(compressToEncodedURIComponent('{"swaps":"x"}'))).toBeNull()
  })

  it('still decodes a realistic large list (no false positive on the cap)', () => {
    // 500 distinct ids compress to ~1377 chars — the largest the encode side emits
    // before its own MAX_TRADE_PARAM_LENGTH guard kicks in. Must round-trip cleanly.
    const swaps = Array.from({ length: 500 }, (_, i) => `S-${i}`)
    const encoded = encodeTradeSwapsOnly(swaps)
    expect(encoded.length).toBeLessThanOrEqual(MAX_TRADE_PARAM_LENGTH)
    expect(decodeTradePayload(encoded)?.swaps).toHaveLength(500)
  })

  it('rejects an over-long inbound param before decompressing', () => {
    expect(decodeTradePayload('A'.repeat(MAX_TRADE_PARAM_LENGTH + 1))).toBeNull()
  })

  it('rejects a decompression bomb (small param, huge decompressed JSON)', () => {
    // Highly repetitive data compresses tiny but expands past the JSON ceiling.
    const bomb = compressToEncodedURIComponent(
      JSON.stringify({ swaps: Array(8000).fill('AAA') }),
    )
    // Sanity: this exercises the post-decompress cap, not the inbound-length cap.
    expect(bomb.length).toBeLessThanOrEqual(MAX_TRADE_PARAM_LENGTH)
    expect(JSON.stringify({ swaps: Array(8000).fill('AAA') }).length).toBeGreaterThan(
      MAX_DECODED_JSON_LENGTH,
    )
    expect(decodeTradePayload(bomb)).toBeNull()
  })

  it('rejects a list longer than the catalog cap', () => {
    const swaps = Array(MAX_TRADE_LIST_LENGTH + 1).fill('A')
    expect(decodeTradePayload(encodeTradeSwapsOnly(swaps))).toBeNull()
  })
})
