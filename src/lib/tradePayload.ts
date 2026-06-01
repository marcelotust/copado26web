import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
export { AUTH_POST_LOGIN_PATH_KEY } from './tradeAuthStorage'

export type TradePayload = {
  swaps: string[]
  missing: string[]
  /** True when the QR/link carried the peer's duplicates — enables computing "you receive". */
  hasPeerSwapsList: boolean
  /** True when the QR/link carried the peer's missing list — enables computing "you give". */
  hasPeerMissingList: boolean
}

/** Compressed payload grows with list size; QR scanners struggle beyond ~2k chars. */
export const MAX_TRADE_PARAM_LENGTH = 1800

/**
 * Decompressed JSON ceiling. lz-string amplifies ~245x, so an attacker-controlled
 * `?d=`/QR value capped at MAX_TRADE_PARAM_LENGTH could still expand to hundreds of KB.
 * A full album list (~994 ids) serializes well under this; anything larger is hostile.
 */
export const MAX_DECODED_JSON_LENGTH = 20_000

/** Per-list id cap; the catalog has ~994 stickers, so neither list can legitimately exceed this. */
export const MAX_TRADE_LIST_LENGTH = 1000

function isStringListWithinCap(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_TRADE_LIST_LENGTH &&
    value.every((x): x is string => typeof x === 'string')
  )
}

/** Legacy: kept for backwards compatibility with older callers / tests. */
export function encodeTradeSwapsOnly(swaps: string[]): string {
  return compressToEncodedURIComponent(JSON.stringify({ swaps }))
}

export type TradeEncodeKind = 'both' | 'swaps' | 'missing'

/**
 * Try to send both lists so the receiver sees both directions in one scan. When the joint
 * payload is too large for a QR, fall back to the smaller of {swaps, missing} alone — since
 * those are disjoint, min(swaps, missing) ≤ total/2, which always fits.
 *
 * When both lists are empty, returns kind='swaps' with an empty payload; caller should treat
 * as nothing-to-share.
 */
export function encodeTradePayload(
  swaps: string[],
  missing: string[],
): { d: string; kind: TradeEncodeKind } {
  if (swaps.length === 0 && missing.length === 0) {
    return { d: compressToEncodedURIComponent(JSON.stringify({ swaps: [] })), kind: 'swaps' }
  }

  if (swaps.length > 0 && missing.length > 0) {
    const both = compressToEncodedURIComponent(JSON.stringify({ swaps, missing }))
    if (both.length <= MAX_TRADE_PARAM_LENGTH) return { d: both, kind: 'both' }
  }

  let kind: 'swaps' | 'missing'
  if (swaps.length === 0) kind = 'missing'
  else if (missing.length === 0) kind = 'swaps'
  else kind = swaps.length <= missing.length ? 'swaps' : 'missing'
  const payload = kind === 'swaps' ? { swaps } : { missing }
  return { d: compressToEncodedURIComponent(JSON.stringify(payload)), kind }
}

/** @deprecated Use encodeTradePayload — picks the best shape automatically. */
export const encodeTradeSmaller = encodeTradePayload

export function decodeTradePayload(d: string | null | undefined): TradePayload | null {
  if (d === undefined || d === null) return null
  const input = String(d).trim()
  if (!input || input.length > MAX_TRADE_PARAM_LENGTH) return null
  try {
    const json = decompressFromEncodedURIComponent(input)
    if (!json || json.length > MAX_DECODED_JSON_LENGTH) return null
    const o = JSON.parse(json) as unknown
    if (!o || typeof o !== 'object') return null
    const raw = o as Record<string, unknown>

    const hasSwapsField = Object.hasOwn(raw, 'swaps')
    const hasMissingField = Object.hasOwn(raw, 'missing')
    if (!hasSwapsField && !hasMissingField) return null

    let swaps: string[] = []
    if (hasSwapsField) {
      if (!isStringListWithinCap(raw.swaps)) return null
      swaps = raw.swaps
    }

    let missing: string[] = []
    if (hasMissingField) {
      if (!isStringListWithinCap(raw.missing)) return null
      missing = raw.missing
    }

    return {
      swaps,
      missing,
      hasPeerSwapsList: hasSwapsField,
      hasPeerMissingList: hasMissingField,
    }
  } catch {
    return null
  }
}
