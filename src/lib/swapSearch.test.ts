import { describe, expect, it } from 'vitest'
import { filterSwapGroups, normalizeSearch } from './swapSearch'
import type { SwapGroup } from '../state/stickersTypes'

const groups: SwapGroup[] = [
  { teamCode: 'BRA', stickers: [] },
  { teamCode: 'QAT', stickers: [] },
  { teamCode: 'KSA', stickers: [] },
]

const names: Record<string, string> = { BRA: 'Brasil', QAT: 'Qatar', KSA: 'Arábia Saudita' }
const teamName = (code: string) => names[code] ?? code

describe('normalizeSearch', () => {
  it('lowercases, trims and strips accents', () => {
    expect(normalizeSearch('  Árabia ')).toBe('arabia')
  })
})

describe('filterSwapGroups', () => {
  it('returns all groups for an empty query', () => {
    expect(filterSwapGroups(groups, '', teamName)).toHaveLength(3)
    expect(filterSwapGroups(groups, '   ', teamName)).toHaveLength(3)
  })

  it('matches the 3-letter code case-insensitively', () => {
    expect(filterSwapGroups(groups, 'bra', teamName)).toEqual([groups[0]])
    expect(filterSwapGroups(groups, 'BRA', teamName)).toEqual([groups[0]])
  })

  it('matches a code prefix', () => {
    expect(filterSwapGroups(groups, 'qat', teamName)).toEqual([groups[1]])
  })

  it('matches the translated team name', () => {
    expect(filterSwapGroups(groups, 'qatar', teamName)).toEqual([groups[1]])
  })

  it('matches names ignoring accents', () => {
    expect(filterSwapGroups(groups, 'arabia', teamName)).toEqual([groups[2]])
  })

  it('returns an empty list when nothing matches', () => {
    expect(filterSwapGroups(groups, 'xyz', teamName)).toEqual([])
  })
})
