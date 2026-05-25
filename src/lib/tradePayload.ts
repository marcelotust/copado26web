import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
export { AUTH_POST_LOGIN_PATH_KEY } from './tradeAuthStorage'

export type TradePayload = {
  swaps: string[]
  missing: string[]
  /** False when the QR/link only carried the other person's duplicates (smaller payload). */
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

/** QR / share link: only duplicates — enough to compute what you receive from them. */
export function encodeTradeSwapsOnly(swaps: string[]): string {
  return compressToEncodedURIComponent(JSON.stringify({ swaps }))
}

export function decodeTradePayload(d: string | null | undefined): TradePayload | null {
  if (d === undefined || d === null) return null
  const input = String(d).trim()
  // Reject before decompressing: a valid param never exceeds what the encode side emits.
  if (!input || input.length > MAX_TRADE_PARAM_LENGTH) return null
  try {
    const json = decompressFromEncodedURIComponent(input)
    if (!json || json.length > MAX_DECODED_JSON_LENGTH) return null
    const o = JSON.parse(json) as unknown
    if (!o || typeof o !== 'object') return null
    const raw = o as Record<string, unknown>
    const swaps = raw.swaps
    if (!isStringListWithinCap(swaps)) return null

    if (!Object.hasOwn(raw, 'missing')) {
      return { swaps, missing: [], hasPeerMissingList: false }
    }

    const missing = raw.missing
    if (!isStringListWithinCap(missing)) return null
    return { swaps, missing, hasPeerMissingList: true }
  } catch {
    return null
  }
}
