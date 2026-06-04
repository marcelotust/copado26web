import type { CatalogSticker } from '../types/database'

/** team_code → sticker_number → sticker_id */
export type PasteLookup = Map<string, Map<number, string>>

export type ParsePasteResult = {
  found: Map<string, number>
  unknownCodes: string[]
}

export function buildPasteLookup(catalog: Map<string, CatalogSticker>): PasteLookup {
  const lookup: PasteLookup = new Map()
  for (const sticker of catalog.values()) {
    let byNumber = lookup.get(sticker.team_code)
    if (!byNumber) {
      byNumber = new Map()
      lookup.set(sticker.team_code, byNumber)
    }
    byNumber.set(sticker.number, sticker.id)
  }
  return lookup
}

export function parsePasteText(text: string, lookup: PasteLookup): ParsePasteResult {
  const found = new Map<string, number>()
  const unknownCodes: string[] = []
  const seenUnknown = new Set<string>()

  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue

    const spaceIdx = line.search(/\s/)
    if (spaceIdx === -1) continue

    const teamCode = line.slice(0, spaceIdx).toUpperCase()
    const rest = line.slice(spaceIdx + 1)
    const numbers = rest
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number)
      .filter(n => Number.isInteger(n) && n > 0)

    if (numbers.length === 0) continue

    const byNumber = lookup.get(teamCode)
    if (!byNumber) {
      if (!seenUnknown.has(teamCode)) {
        seenUnknown.add(teamCode)
        unknownCodes.push(teamCode)
      }
      continue
    }

    for (const n of numbers) {
      const id = byNumber.get(n)
      if (id) found.set(id, 1)
    }
  }

  return { found, unknownCodes }
}

export function applyPasteAdditive(
  existing: Map<string, number>,
  found: Map<string, number>,
): Map<string, number> {
  const result = new Map(existing)
  for (const id of found.keys()) {
    result.set(id, Math.max(result.get(id) ?? 0, 1))
  }
  return result
}
