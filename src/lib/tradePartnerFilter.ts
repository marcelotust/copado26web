import { normalizeSearch } from './swapSearch'
import type { TradePartner } from '../hooks/useTradePartners'

export type TradePartnerSort = 'best' | 'alpha'

/**
 * Filters partners by nickname and display name, case- and accent-insensitive.
 * An empty query returns the list unchanged.
 */
export function filterTradePartners(partners: TradePartner[], query: string): TradePartner[] {
  const q = normalizeSearch(query)
  if (!q) return partners
  return partners.filter(partner =>
    normalizeSearch(partner.nickname).includes(q)
    || normalizeSearch(partner.display_name).includes(q),
  )
}

/**
 * Sorts partners without mutating the input.
 * - 'best': most stickers the partner has that I need first, tie-broken by how
 *   many I have that they need (the default trade-value ordering).
 * - 'alpha': by display name (falling back to nickname), A→Z, accent-insensitive.
 */
export function sortTradePartners(
  partners: TradePartner[],
  sort: TradePartnerSort,
): TradePartner[] {
  const copy = partners.slice()
  if (sort === 'alpha') {
    return copy.sort((a, b) =>
      normalizeSearch(a.display_name || a.nickname)
        .localeCompare(normalizeSearch(b.display_name || b.nickname)),
    )
  }
  return copy.sort((a, b) =>
    b.they_have_i_need - a.they_have_i_need
    || b.i_have_they_need - a.i_have_they_need,
  )
}
