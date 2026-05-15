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

export type TradeListAnalysis = {
  ids: string[]
  unknownTeamCodes: string[]
  noCodesFound: boolean
  fromAppShare: boolean
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
    return { ids: [], unknownTeamCodes: [], noCodesFound: false, fromAppShare: false }
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

  return {
    ids,
    unknownTeamCodes,
    noCodesFound: ids.length === 0,
    fromAppShare,
  }
}
