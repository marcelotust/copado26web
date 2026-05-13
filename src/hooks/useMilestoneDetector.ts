import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { hydrateMilestone, milestoneQueueKey, type Milestone } from '../lib/milestoneDetection'
import { computeFeaturedTeamsProgress, detectMilestoneTransitions } from '../lib/milestoneDetectorSync'
import { loadPersistedMilestones, persistedMilestoneKey } from '../lib/milestoneStorage'
import { useStickersContext } from '../state/StickersProvider'
import { useAlbumProgress } from '../state/stickersStore'

export type { Milestone } from '../lib/milestoneDetection'

export type UseMilestoneDetectorArgs = { userId: string; t: (key: string) => string }

export function useMilestoneDetector({ userId, t }: UseMilestoneDetectorArgs): {
  activeMilestone: Milestone | null
  dismissMilestone: () => void
  showMilestone: (m: Milestone) => void
  earnedMilestones: Milestone[]
} {
  const { status, teams, byTeam, quantities } = useStickersContext()
  const { total: albumTotal, collected: albumCollected } = useAlbumProgress()
  const [queue, setQueue] = useState<Milestone[]>([])
  const [storageEpoch, setStorageEpoch] = useState(0)
  const seededRef = useRef(false)
  const prevAlbumRatioRef = useRef<number | null>(null)
  const prevTeamCompleteRef = useRef<Record<string, boolean> | null>(null)
  const firedKeysRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    firedKeysRef.current = new Set(loadPersistedMilestones(userId).map(persistedMilestoneKey))
    seededRef.current = false
    prevAlbumRatioRef.current = null
    prevTeamCompleteRef.current = null
    setQueue([])
  }, [userId])

  const persisted = useMemo(() => {
    void storageEpoch
    return loadPersistedMilestones(userId)
  }, [userId, storageEpoch])

  const earnedMilestones = useMemo(() => {
    const hydrated = persisted.map((e) => hydrateMilestone(e, teams, t))
    return [...hydrated].reverse()
  }, [persisted, teams, t])

  const featuredProgress = useMemo(
    () => computeFeaturedTeamsProgress(byTeam, quantities),
    [byTeam, quantities],
  )

  useEffect(() => {
    const toAdd = detectMilestoneTransitions(
      {
        seeded: seededRef,
        prevAlbumRatio: prevAlbumRatioRef,
        prevTeamComplete: prevTeamCompleteRef,
        firedKeys: firedKeysRef,
      },
      {
        status,
        albumTotal,
        albumCollected,
        featuredProgress,
        teams,
        t,
        userId,
      },
    )
    if (!toAdd.length) return
    setQueue((q) => {
      const seen = new Set(q.map(milestoneQueueKey))
      const merged = [...q]
      for (const m of toAdd) {
        const k = milestoneQueueKey(m)
        if (seen.has(k)) continue
        seen.add(k)
        merged.push(m)
      }
      return merged
    })
    setStorageEpoch((n) => n + 1)
  }, [status, albumTotal, albumCollected, featuredProgress, teams, t, userId])

  const dismissMilestone = useCallback(() => {
    setQueue((q) => q.slice(1))
  }, [])

  const showMilestone = useCallback((m: Milestone) => {
    setQueue((q) => {
      const k = milestoneQueueKey(m)
      if (q.some((x) => milestoneQueueKey(x) === k)) return q
      return [m, ...q]
    })
  }, [])

  return {
    activeMilestone: queue[0] ?? null,
    dismissMilestone,
    showMilestone,
    earnedMilestones,
  }
}