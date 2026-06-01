import { describe, expect, it } from 'vitest'
import { compressToEncodedURIComponent } from 'lz-string'
import {
  MAX_DECODED_JSON_LENGTH,
  MAX_TRADE_LIST_LENGTH,
  MAX_TRADE_PARAM_LENGTH,
  decodeTradePayload,
  encodeTradeSmaller,
  encodeTradeSwapsOnly,
} from './tradePayload'

describe('decodeTradePayload', () => {
  it('round-trips a swaps-only link (legacy)', () => {
    const encoded = encodeTradeSwapsOnly(['BRA-01', 'ARG-02'])
    expect(decodeTradePayload(encoded)).toEqual({
      swaps: ['BRA-01', 'ARG-02'],
      missing: [],
      hasPeerSwapsList: true,
      hasPeerMissingList: false,
    })
  })

  it('decodes a payload carrying both lists', () => {
    const encoded = compressToEncodedURIComponent(
      JSON.stringify({ swaps: ['BRA-01'], missing: ['ARG-02'] }),
    )
    expect(decodeTradePayload(encoded)).toEqual({
      swaps: ['BRA-01'],
      missing: ['ARG-02'],
      hasPeerSwapsList: true,
      hasPeerMissingList: true,
    })
  })

  it('decodes a missing-only payload (new bidirectional format)', () => {
    const encoded = compressToEncodedURIComponent(JSON.stringify({ missing: ['BRA-01', 'ARG-02'] }))
    expect(decodeTradePayload(encoded)).toEqual({
      swaps: [],
      missing: ['BRA-01', 'ARG-02'],
      hasPeerSwapsList: false,
      hasPeerMissingList: true,
    })
  })

  it('returns null for nullish or empty input', () => {
    expect(decodeTradePayload(null)).toBeNull()
    expect(decodeTradePayload(undefined)).toBeNull()
    expect(decodeTradePayload('')).toBeNull()
    expect(decodeTradePayload('   ')).toBeNull()
  })

  it('returns null when neither swaps nor missing is present', () => {
    expect(decodeTradePayload(compressToEncodedURIComponent('{}'))).toBeNull()
  })

  it('returns null when fields are present but not string arrays', () => {
    expect(decodeTradePayload(compressToEncodedURIComponent('{"swaps":[1,2]}'))).toBeNull()
    expect(decodeTradePayload(compressToEncodedURIComponent('{"missing":"x"}'))).toBeNull()
  })

  it('rejects an over-long inbound param before decompressing', () => {
    expect(decodeTradePayload('A'.repeat(MAX_TRADE_PARAM_LENGTH + 1))).toBeNull()
  })

  it('rejects a decompression bomb (small param, huge decompressed JSON)', () => {
    const bomb = compressToEncodedURIComponent(
      JSON.stringify({ swaps: Array(8000).fill('AAA') }),
    )
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

describe('encodeTradeSmaller', () => {
  it('sends swaps when it is the smaller list', () => {
    const { d, kind } = encodeTradeSmaller(['A', 'B'], ['C', 'D', 'E'])
    expect(kind).toBe('swaps')
    expect(decodeTradePayload(d)).toEqual({
      swaps: ['A', 'B'],
      missing: [],
      hasPeerSwapsList: true,
      hasPeerMissingList: false,
    })
  })

  it('sends missing when it is the smaller list', () => {
    const { d, kind } = encodeTradeSmaller(['A', 'B', 'C'], ['D'])
    expect(kind).toBe('missing')
    expect(decodeTradePayload(d)).toEqual({
      swaps: [],
      missing: ['D'],
      hasPeerSwapsList: false,
      hasPeerMissingList: true,
    })
  })

  it('falls back to the non-empty side when the other is empty', () => {
    expect(encodeTradeSmaller([], ['A', 'B']).kind).toBe('missing')
    expect(encodeTradeSmaller(['A', 'B'], []).kind).toBe('swaps')
  })

  it('breaks ties toward swaps (preserves legacy receive-first behavior)', () => {
    const { kind } = encodeTradeSmaller(['A'], ['B'])
    expect(kind).toBe('swaps')
  })
})
