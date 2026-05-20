import { useMemo } from 'react'
import { useStickersContext } from './StickersProvider'
import type { MissingGroup, SwapGroup } from './stickersTypes'
import type { Sticker } from '../types/database'

export function useSectionStickers(teamCode: string): Sticker[] {
  const { catalog, byTeam, quantities } = useStickersContext()
  return useMemo(() => {
    const ids = byTeam.get(teamCode) ?? []
    return ids.flatMap(id => {
      const c = catalog.get(id)
      return c ? [{ ...c, quantity: quantities.get(id) ?? 0 }] : []
    })
  }, [catalog, byTeam, quantities, teamCode])
}

export function useSwaps(): { swapsByTeam: SwapGroup[]; total: number } {
  const { teams, catalog, byTeam, quantities } = useStickersContext()
  return useMemo(() => {
    const groups: SwapGroup[] = []
    let total = 0
    for (const team of teams) {
      const ids = byTeam.get(team.code) ?? []
      const stickers: Sticker[] = []
      for (const id of ids) {
        const qty = quantities.get(id) ?? 0
        if (qty > 1) {
          const c = catalog.get(id)
          if (!c) continue
          stickers.push({ ...c, quantity: qty })
          total += qty - 1
        }
      }
      if (stickers.length) groups.push({ teamCode: team.code, stickers })
    }
    return { swapsByTeam: groups, total }
  }, [teams, catalog, byTeam, quantities])
}

/** Total extra copies (qty − 1) in a single section. Returns 0 when no swaps. */
export function useSectionSwapCount(teamCode: string): number {
  const { byTeam, quantities } = useStickersContext()
  return useMemo(() => {
    const ids = byTeam.get(teamCode) ?? []
    let total = 0
    for (const id of ids) {
      const qty = quantities.get(id) ?? 0
      if (qty > 1) total += qty - 1
    }
    return total
  }, [byTeam, quantities, teamCode])
}

/** Flat sticker IDs for QR trade payload: extras (qty > 1) and missing (qty === 0). */
export function useTradeIdLists(): { swapIds: string[]; missingIds: string[] } {
  const { teams, catalog, byTeam, quantities } = useStickersContext()
  return useMemo(() => {
    const swapIds: string[] = []
    const missingIds: string[] = []
    for (const team of teams) {
      const ids = byTeam.get(team.code) ?? []
      for (const id of ids) {
        const qty = quantities.get(id) ?? 0
        if (qty > 1) swapIds.push(id)
        if (qty === 0 && catalog.get(id)) missingIds.push(id)
      }
    }
    return { swapIds, missingIds }
  }, [teams, catalog, byTeam, quantities])
}

export function useMissing(): MissingGroup[] {
  const { teams, catalog, byTeam, quantities } = useStickersContext()
  return useMemo(() => {
    const groups: MissingGroup[] = []
    for (const team of teams) {
      const ids = byTeam.get(team.code) ?? []
      const numbers: number[] = []
      for (const id of ids) {
        if ((quantities.get(id) ?? 0) === 0) {
          const c = catalog.get(id)
          if (c) numbers.push(c.number)
        }
      }
      if (numbers.length) groups.push({ teamCode: team.code, numbers })
    }
    return groups
  }, [teams, catalog, byTeam, quantities])
}
