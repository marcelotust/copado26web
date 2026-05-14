import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'

export type TradePayload = { swaps: string[]; missing: string[] }

/** Compressed payload grows with list size; QR scanners struggle beyond ~2k chars. */
export const MAX_TRADE_PARAM_LENGTH = 1800

export function encodeTradePayload(payload: TradePayload): string {
  return compressToEncodedURIComponent(JSON.stringify(payload))
}

export function decodeTradePayload(d: string | null | undefined): TradePayload | null {
  if (d === undefined || d === null || !String(d).trim()) return null
  try {
    const json = decompressFromEncodedURIComponent(String(d).trim())
    if (!json) return null
    const o = JSON.parse(json) as unknown
    if (!o || typeof o !== 'object') return null
    const { swaps, missing } = o as Partial<TradePayload>
    if (!Array.isArray(swaps) || !Array.isArray(missing)) return null
    if (!swaps.every((x) => typeof x === 'string') || !missing.every((x) => typeof x === 'string')) {
      return null
    }
    return { swaps, missing }
  } catch {
    return null
  }
}

export const AUTH_POST_LOGIN_PATH_KEY = 'meualbum2026_post_login_path'
