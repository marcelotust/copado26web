/**
 * Sticker token in share messages: `BRA 01`, `ESP-12` (not inside words/URLs).
 * Must be preceded by start/whitespace/· and followed by whitespace/·/×/end.
 */
const STICKER_TOKEN_RE = /(?:^|[\s·])([A-Z]{2,3})[\s-](\d{1,2})(?=(?:\s|·|×|$))/g

const APP_SHARE_MARKERS = [
  /meualbum/i,
  /meu\s*álbum/i,
  /copa.*2026/i,
  /figurinha/i,
  /faltam\s+\d+/i,
  /sobras|repetida/i,
] as const

/** Headline of the "missing" share — the codes are what the sender NEEDS. */
const MISSING_MARKER = /\bfaltam\b|\bme\s+faltam\b/i
/** Headline of the "swaps" share — the codes are what the sender HAS spare. */
const SWAPS_MARKER = /sobras|repetida/i

/**
 * What the pasted codes represent, inferred from the share headline:
 * - `swaps`: sender's duplicates (they HAVE) → feeds the "+1, I pick up" side.
 * - `missing`: sender's gaps (they NEED) → feeds the "-1, I hand over" side.
 * - `unknown`: manual list / both / neither marker → treat the -1 side with care.
 */
export type TradeListKind = 'swaps' | 'missing' | 'unknown'

export type TradeListAnalysis = {
  ids: string[]
  unknownTeamCodes: string[]
  noCodesFound: boolean
  fromAppShare: boolean
  kind: TradeListKind
}

/** Parses pasted lists (WhatsApp share, manual) into catalog ids like `BRA-03`. */
export function parseTradeList(text: string): string[] {
  const matches = text.toUpperCase().matchAll(STICKER_TOKEN_RE)
  return [...matches].map(([, team, num]) => `${team}-${num.padStart(2, '0')}`)
}

export function analyzeTradeListPaste(
  text: string,
  validTeamCodes: ReadonlySet<string>,
): TradeListAnalysis {
  const trimmed = text.trim()
  if (!trimmed) {
    return { ids: [], unknownTeamCodes: [], noCodesFound: false, fromAppShare: false, kind: 'unknown' }
  }

  const ids = parseTradeList(trimmed)
  const unknownTeamCodes = [
    ...new Set(
      ids
        .map(id => id.split('-')[0]!)
        .filter(team => !validTeamCodes.has(team)),
    ),
  ]

  const fromAppShare = APP_SHARE_MARKERS.some(re => re.test(trimmed))

  const hasMissing = MISSING_MARKER.test(trimmed)
  const hasSwaps = SWAPS_MARKER.test(trimmed)
  const kind: TradeListKind =
    hasMissing && !hasSwaps ? 'missing' : hasSwaps && !hasMissing ? 'swaps' : 'unknown'

  return {
    ids,
    unknownTeamCodes,
    noCodesFound: ids.length === 0,
    fromAppShare,
    kind,
  }
}
