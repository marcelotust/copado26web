import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'

export type TradePayload = {
  swaps: string[]
  missing: string[]
  /** False when the QR/link only carried the other person's duplicates (smaller payload). */
  hasPeerMissingList: boolean
}

/** Compressed payload grows with list size; QR scanners struggle beyond ~2k chars. */
export const MAX_TRADE_PARAM_LENGTH = 1800

/** QR / share link: only duplicates — enough to compute what you receive from them. */
export function encodeTradeSwapsOnly(swaps: string[]): string {
  return compressToEncodedURIComponent(JSON.stringify({ swaps }))
}

export function decodeTradePayload(d: string | null | undefined): TradePayload | null {
  if (d === undefined || d === null || !String(d).trim()) return null
  try {
    const json = decompressFromEncodedURIComponent(String(d).trim())
    if (!json) return null
    const o = JSON.parse(json) as unknown
    if (!o || typeof o !== 'object') return null
    const raw = o as Record<string, unknown>
    const swaps = raw.swaps
    if (!Array.isArray(swaps) || !swaps.every((x): x is string => typeof x === 'string')) return null

    if (!Object.hasOwn(raw, 'missing')) {
      return { swaps, missing: [], hasPeerMissingList: false }
    }

    const missing = raw.missing
    if (!Array.isArray(missing) || !missing.every((x): x is string => typeof x === 'string')) {
      return null
    }
    return { swaps, missing, hasPeerMissingList: true }
  } catch {
    return null
  }
}

export const AUTH_POST_LOGIN_PATH_KEY = 'meualbum2026_post_login_path'
