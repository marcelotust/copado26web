import type { Challenge } from '../data/challenges'
import type { Team } from '../types/database'
import {
  resolveAlbumTotal,
  resolveTargetIds,
  resolveTeamCode,
  resolveTeamCodes,
  type Resolution,
} from './challengeResolveBasics'
import { resolveConfGroups, resolveConfs, resolveGroupLetter } from './challengeResolveBuckets'

export function resolveChallengeProgress(
  challenge: Challenge,
  teams: Team[],
  byTeam: Map<string, string[]>,
  quantities: Map<string, number>,
  albumCollected: number,
): Resolution {
  if (challenge.albumTotal) {
    return resolveAlbumTotal(challenge.requiredQty, albumCollected)
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
  if (challenge.teamCodes?.length) {
    return resolveTeamCodes(
      challenge.teamCodes,
      challenge.requiredQty,
      challenge.perTeam ?? false,
      byTeam,
      quantities,
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
