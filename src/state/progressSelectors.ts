import { useStickersContext } from './StickersProvider'
import type { Status } from './stickersTypes'
import type { Team } from '../types/database'

export function useStickersStatus(): { status: Status; error: Error | null } {
  const { status, error } = useStickersContext()
  return { status, error }
}

export function useTeams(): Team[] {
  return useStickersContext().teams
}

export function useTeam(code: string): Team | null {
  return useTeams().find(t => t.code === code) ?? null
}

export function useSectionProgress(teamCode: string): { total: number; collected: number } {
  const { byTeam, quantities } = useStickersContext()
  const ids = byTeam.get(teamCode) ?? []
  let collected = 0
  for (const id of ids) if ((quantities.get(id) ?? 0) >= 1) collected++
  return { total: ids.length, collected }
}

export function useAlbumProgress(): { total: number; collected: number; swaps: number } {
  const { catalog, quantities } = useStickersContext()
  let collected = 0
  let swaps = 0
  for (const qty of quantities.values()) {
    if (qty >= 1) collected++
    if (qty > 1) swaps += qty - 1
  }
  return { total: catalog.size, collected, swaps }
}
