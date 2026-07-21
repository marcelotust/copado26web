import { describe, expect, it } from 'vitest'
import { filterTradePartners, sortTradePartners } from './tradePartnerFilter'
import type { TradePartner } from '../hooks/useTradePartners'

function partner(over: Partial<TradePartner>): TradePartner {
  return {
    user_id: over.nickname ?? 'u',
    nickname: over.nickname ?? 'user',
    display_name: over.display_name ?? '',
    avatar_url: null,
    completion_pct: 0,
    they_have_i_need: over.they_have_i_need ?? 0,
    i_have_they_need: over.i_have_they_need ?? 0,
    ...over,
  }
}

const ana = partner({ nickname: 'ana', display_name: 'Ana Álvarez', they_have_i_need: 3, i_have_they_need: 5 })
const bruno = partner({ nickname: 'bruno', display_name: 'Bruno', they_have_i_need: 8, i_have_they_need: 1 })
const caio = partner({ nickname: 'caio', display_name: 'Caio', they_have_i_need: 8, i_have_they_need: 4 })
const list = [ana, bruno, caio]

describe('filterTradePartners', () => {
  it('returns all for empty query', () => {
    expect(filterTradePartners(list, '  ')).toHaveLength(3)
  })

  it('matches nickname case-insensitively', () => {
    expect(filterTradePartners(list, 'BRU')).toEqual([bruno])
  })

  it('matches display name ignoring accents', () => {
    expect(filterTradePartners(list, 'alvarez')).toEqual([ana])
  })

  it('returns empty when nothing matches', () => {
    expect(filterTradePartners(list, 'zzz')).toEqual([])
  })
})

describe('sortTradePartners', () => {
  it('best: they_have_i_need desc, tie-broken by i_have_they_need desc', () => {
    expect(sortTradePartners(list, 'best')).toEqual([caio, bruno, ana])
  })

  it('alpha: by display name A→Z', () => {
    expect(sortTradePartners(list, 'alpha')).toEqual([ana, bruno, caio])
  })

  it('does not mutate the input', () => {
    const input = [caio, ana, bruno]
    sortTradePartners(input, 'alpha')
    expect(input).toEqual([caio, ana, bruno])
  })
})
