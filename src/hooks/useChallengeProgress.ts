import { useMemo } from 'react'
import { useStickersContext } from '../state/StickersProvider'
import { useAlbumProgress } from '../state/stickersStore'
import { CHALLENGES, type Challenge } from '../data/challenges'
import type { Team } from '../types/database'

export type ChallengeResult = {
  challenge: Challenge
  owned: number
  total: number
  pct: number
  completed: boolean
}

type Resolution = { owned: number; total: number }

function resolveAlbumTotal(
  requiredQty: number,
  albumCollected: number,
): Resolution {
  const total = requiredQty
  return { owned: Math.min(albumCollected, total), total }
}

function resolveTeamCode(
  teamCode: string,
  requiredQty: number | 'all',
  byTeam: Map<string, string[]>,
  quantities: Map<string, number>,
): Resolution {
  const ids = byTeam.get(teamCode) ?? []
  const owned = ids.filter(id => (quantities.get(id) ?? 0) >= 1).length
  const total = requiredQty === 'all' ? ids.length : Math.min(requiredQty, ids.length)
  return { owned: Math.min(owned, total), total }
}

function resolveGroupLetter(
  groupLetter: string,
  requiredQty: number | 'all',
  perTeam: boolean,
  teams: Team[],
  byTeam: Map<string, string[]>,
  quantities: Map<string, number>,
): Resolution {
  const teamsInGroup = teams.filter(t => t.group_letter === groupLetter)

  if (perTeam) {
    const owned = teamsInGroup.filter(t => {
      const ids = byTeam.get(t.code) ?? []
      return ids.some(id => (quantities.get(id) ?? 0) >= 1)
    }).length
    return { owned, total: teamsInGroup.length }
  }

  const allIds = teamsInGroup.flatMap(t => byTeam.get(t.code) ?? [])
  const owned = allIds.filter(id => (quantities.get(id) ?? 0) >= 1).length
  return { owned, total: allIds.length }
}

function resolveTargetIds(
  targetIds: string[],
  requiredQty: number | 'all',
  quantities: Map<string, number>,
): Resolution {
  const owned = targetIds.filter(id => (quantities.get(id) ?? 0) >= 1).length
  const total = requiredQty === 'all' ? targetIds.length : (requiredQty as number)
  return { owned: Math.min(owned, total), total }
}

function resolveConfs(
  confs: string[],
  requiredQty: number | 'all',
  perTeam: boolean,
  teams: Team[],
  byTeam: Map<string, string[]>,
  quantities: Map<string, number>,
): Resolution {
  const teamsInConfs = teams.filter(t => confs.includes(t.conf))

  if (perTeam) {
    const owned = teamsInConfs.filter(t => {
      const ids = byTeam.get(t.code) ?? []
      const collected = ids.filter(id => (quantities.get(id) ?? 0) >= 1).length
      if (requiredQty === 'all') return collected === ids.length
      return collected >= (requiredQty as number)
    }).length
    return { owned, total: teamsInConfs.length }
  }

  const allIds = teamsInConfs.flatMap(t => byTeam.get(t.code) ?? [])
  const owned = allIds.filter(id => (quantities.get(id) ?? 0) >= 1).length
  const total = requiredQty === 'all' ? allIds.length : (requiredQty as number)
  return { owned: Math.min(owned, total), total }
}

function resolveConfGroups(
  confGroups: string[][],
  teams: Team[],
  byTeam: Map<string, string[]>,
  quantities: Map<string, number>,
): Resolution {
  const owned = confGroups.filter(slot =>
    teams.some(
      t =>
        slot.includes(t.conf) &&
        (byTeam.get(t.code) ?? []).some(id => (quantities.get(id) ?? 0) >= 1),
    ),
  ).length
  return { owned, total: confGroups.length }
}

function resolve(
  challenge: Challenge,
  teams: Team[],
  byTeam: Map<string, string[]>,
  quantities: Map<string, number>,
  albumCollected: number,
): Resolution {
  if (challenge.albumTotal) {
    return resolveAlbumTotal(challenge.requiredQty as number, albumCollected)
  }
  if (challenge.confGroups) {
    return resolveConfGroups(challenge.confGroups, teams, byTeam, quantities)
  }
  if (challenge.confs) {
    return resolveConfs(
      challenge.confs,
      challenge.requiredQty,
      challenge.perTeam ?? false,
      teams, byTeam, quantities,
    )
  }
  if (challenge.groupLetter) {
    return resolveGroupLetter(
      challenge.groupLetter,
      challenge.requiredQty,
      challenge.perTeam ?? false,
      teams, byTeam, quantities,
    )
  }
  if (challenge.teamCode) {
    return resolveTeamCode(challenge.teamCode, challenge.requiredQty, byTeam, quantities)
  }
  if (challenge.targetIds) {
    return resolveTargetIds(challenge.targetIds, challenge.requiredQty, quantities)
  }
  return { owned: 0, total: 1 }
}

export function useChallengeProgress(): ChallengeResult[] {
  const { teams, byTeam, quantities } = useStickersContext()
  const { collected: albumCollected } = useAlbumProgress()

  return useMemo(() => {
    return CHALLENGES.map(challenge => {
      const { owned, total } = resolve(challenge, teams, byTeam, quantities, albumCollected)
      const pct = total > 0 ? Math.round((owned / total) * 100) : 0
      const completed = total > 0 && owned >= total
      return { challenge, owned, total, pct, completed }
    })
  }, [teams, byTeam, quantities, albumCollected])
}
