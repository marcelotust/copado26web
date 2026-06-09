import type { CatalogSticker } from '../types/database'
import {
  STAR_PLAYERS,
  TEAM_TIERS,
  TIER_TOLERANCE,
  tierIndex,
  type SelectionTier,
} from '../data/fairTrade.tiers'

export type StickerCategory =
  | { kind: 'foil' }
  | { kind: 'special' }
  | { kind: 'star' }
  | { kind: 'regular'; teamTier: SelectionTier }
  | { kind: 'unknown' }

export type SidePartition = {
  fair: string[]
  unfair: string[]
}

export type FairnessPartition = {
  theyHave: SidePartition
  iHave: SidePartition
}

type Catalog = Pick<Map<string, CatalogSticker>, 'get'>

/**
 * Classifica uma figurinha em uma categoria de valor para fins de fairness.
 *
 * Ordem de avaliação:
 *  1. CC e FWC → 'special' (edições temáticas distintas).
 *  2. WAP ou escudo de seleção (is_special && number === 1) → 'foil'.
 *  3. ID em STAR_PLAYERS → 'star'.
 *  4. Resto → 'regular' com o tier da seleção.
 */
export function classifySticker(id: string, catalog: Catalog): StickerCategory {
  const sticker = catalog.get(id)
  if (!sticker) return { kind: 'unknown' }

  const code = sticker.team_code
  if (code === 'CC' || code === 'FWC') return { kind: 'special' }
  if (code === 'WAP') return { kind: 'foil' }
  if (sticker.is_special && sticker.number === 1) return { kind: 'foil' }

  if (STAR_PLAYERS.has(id)) return { kind: 'star' }

  const teamTier = TEAM_TIERS[code]
  return { kind: 'regular', teamTier: teamTier ?? 'C' }
}

/**
 * Particiona uma proposta de troca em IDs "justos" (com peer equivalente do
 * outro lado) e "desbalanceados" (sem peer). O pareamento é greedy:
 *
 *  - Passo 1: casa categorias idênticas com gap exato (regular S↔S, etc.) e
 *    foil/foil, star/star, special/special.
 *  - Passo 2: casa regulares restantes com gap 1 (S↔A, A↔B, B↔C, C↔D).
 *
 * Invariante: `|theyHave.fair| === |iHave.fair|`.
 */
export function partitionByFairness(
  theyHaveIds: readonly string[],
  iHaveIds: readonly string[],
  catalog: Catalog,
): FairnessPartition {
  type Slot = { id: string; category: StickerCategory; matched: boolean }
  const left: Slot[] = theyHaveIds.map(id => ({ id, category: classifySticker(id, catalog), matched: false }))
  const right: Slot[] = iHaveIds.map(id => ({ id, category: classifySticker(id, catalog), matched: false }))

  pairExact(left, right)
  pairAdjacentRegulars(left, right)

  return {
    theyHave: {
      fair: left.filter(s => s.matched).map(s => s.id),
      unfair: left.filter(s => !s.matched).map(s => s.id),
    },
    iHave: {
      fair: right.filter(s => s.matched).map(s => s.id),
      unfair: right.filter(s => !s.matched).map(s => s.id),
    },
  }
}

type Slot = { id: string; category: StickerCategory; matched: boolean }

function pairExact(left: Slot[], right: Slot[]): void {
  for (const l of left) {
    if (l.matched || l.category.kind === 'unknown') continue
    const r = right.find(rr => {
      if (rr.matched) return false
      if (rr.category.kind !== l.category.kind) return false
      if (l.category.kind === 'regular' && rr.category.kind === 'regular') {
        return l.category.teamTier === rr.category.teamTier
      }
      return true
    })
    if (r) { l.matched = true; r.matched = true }
  }
}

function pairAdjacentRegulars(left: Slot[], right: Slot[]): void {
  for (const l of left) {
    if (l.matched || l.category.kind !== 'regular') continue
    const lTier = l.category.teamTier
    const r = right.find(rr => {
      if (rr.matched || rr.category.kind !== 'regular') return false
      return Math.abs(tierIndex(lTier) - tierIndex(rr.category.teamTier)) === TIER_TOLERANCE
    })
    if (r) { l.matched = true; r.matched = true }
  }
}
