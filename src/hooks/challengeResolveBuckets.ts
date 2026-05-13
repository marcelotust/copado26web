import type { Team } from '../types/database'
import type { Resolution } from './challengeResolveBasics'

export function resolveGroupLetter(
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

export function resolveConfs(
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

export function resolveConfGroups(
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
