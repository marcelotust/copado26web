import { useMemo } from 'react'
import { useStickersContext } from '../state/StickersProvider'
import { useAlbumProgress } from '../state/stickersStore'
import { CHALLENGES, type Challenge } from '../data/challenges'
import { resolveChallengeProgress } from './challengeResolve'

export type ChallengeResult = {
  challenge: Challenge
  owned: number
  total: number
  pct: number
  completed: boolean
}

export function useChallengeProgress(): ChallengeResult[] {
  const { teams, byTeam, quantities } = useStickersContext()
  const { collected: albumCollected } = useAlbumProgress()

  return useMemo(() => {
    return CHALLENGES.map(challenge => {
      const { owned, total } = resolveChallengeProgress(
        challenge, teams, byTeam, quantities, albumCollected,
      )
      const pct = total > 0 ? Math.round((owned / total) * 100) : 0
      const completed = total > 0 && owned >= total
      return { challenge, owned, total, pct, completed }
    })
  }, [teams, byTeam, quantities, albumCollected])
}
