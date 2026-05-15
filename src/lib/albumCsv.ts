import type { CatalogSticker } from '../types/database'

export const ALBUM_CSV_HEADER = 'id,team_code,number,label,quantity,is_special' as const

/** Same column order as the historical export in Settings. */
export function buildAlbumCsv(
  catalog: Map<string, CatalogSticker>,
  quantities: Map<string, number>,
): string {
  const rows: string[] = []
  for (const sticker of catalog.values()) {
    const qty = quantities.get(sticker.id) ?? 0
    const label = sticker.player_name ?? ''
    const esc = label.replace(/"/g, '""')
    rows.push(`${sticker.id},${sticker.team_code},${sticker.number},"${esc}",${qty},${sticker.is_special}`)
  }
  rows.sort()
  return [ALBUM_CSV_HEADER, ...rows].join('\n')
}

export type ParsedAlbumRow = {
  id: string
  team_code: string
  number: number
  label: string
  quantity: number
  is_special: boolean
}

export type ParseAlbumCsvResult =
  | { ok: true; rows: ParsedAlbumRow[] }
  | { ok: false; error: string }

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (!inQuotes && c === ',') {
      out.push(cur)
      cur = ''
      continue
    }
    cur += c
  }
  out.push(cur)
  return out
}

function parseBool(raw: string): boolean | null {
  const s = raw.trim().toLowerCase()
  if (s === 'true') return true
  if (s === 'false') return false
  return null
}

/** Split file into logical lines (handles CRLF). */
export function splitCsvLines(text: string): string[] {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  return normalized.split('\n').map(l => l.trim()).filter(Boolean)
}

export function parseAlbumCsv(text: string): ParseAlbumCsvResult {
  const lines = splitCsvLines(text)
  if (lines.length < 2) {
    return { ok: false, error: 'csv.empty' }
  }
  if (lines[0] !== ALBUM_CSV_HEADER) {
    return { ok: false, error: 'csv.badHeader' }
  }
  const seen = new Set<string>()
  const rows: ParsedAlbumRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i])
    if (cells.length !== 6) {
      return { ok: false, error: 'csv.badColumnCount' }
    }
    const [id, team_code, numberRaw, label, qtyRaw, specRaw] = cells
    if (!id || seen.has(id)) {
      return { ok: false, error: seen.has(id) ? 'csv.duplicateId' : 'csv.badId' }
    }
    seen.add(id)
    const number = Number(numberRaw)
    if (!Number.isInteger(number)) {
      return { ok: false, error: 'csv.badNumber' }
    }
    const quantity = Number(qtyRaw)
    if (!Number.isInteger(quantity) || quantity < 0) {
      return { ok: false, error: 'csv.badQuantity' }
    }
    const is_special = parseBool(specRaw)
    if (is_special === null) {
      return { ok: false, error: 'csv.badBoolean' }
    }
    rows.push({
      id,
      team_code,
      number,
      label,
      quantity,
      is_special,
    })
  }
  return { ok: true, rows }
}

export type ValidateAlbumCsvResult =
  | { ok: true; quantities: Map<string, number> }
  | { ok: false; error: string }

export function validateAlbumCsvAgainstCatalog(
  rows: ParsedAlbumRow[],
  catalog: Map<string, CatalogSticker>,
): ValidateAlbumCsvResult {
  const quantities = new Map<string, number>()
  for (const r of rows) {
    const cat = catalog.get(r.id)
    if (!cat) {
      return { ok: false, error: 'csv.unknownSticker' }
    }
    if (cat.team_code !== r.team_code || cat.number !== r.number || cat.is_special !== r.is_special) {
      return { ok: false, error: 'csv.catalogMismatch' }
    }
    if (r.quantity > 0) quantities.set(r.id, r.quantity)
  }
  return { ok: true, quantities }
}

export type QuantityDiffSummary = {
  /** sticker ids with any quantity change */
  changedIds: number
  /** sum of positive deltas (extra copies vs `from`) */
  unitsAdded: number
  /** sum of negative deltas (fewer copies vs `from`) */
  unitsRemoved: number
}

export function diffQuantityMaps(from: Map<string, number>, to: Map<string, number>): QuantityDiffSummary {
  const keys = new Set<string>([...from.keys(), ...to.keys()])
  let changedIds = 0
  let unitsAdded = 0
  let unitsRemoved = 0
  for (const id of keys) {
    const a = from.get(id) ?? 0
    const b = to.get(id) ?? 0
    if (a === b) continue
    changedIds += 1
    const d = b - a
    if (d > 0) unitsAdded += d
    else unitsRemoved += -d
  }
  return { changedIds, unitsAdded, unitsRemoved }
}
