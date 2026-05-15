import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useChallengeProgress, type ChallengeResult } from './useChallengeProgress'
import type { Challenge } from '../data/challenges'
import type { Database } from '../types/database'
import { reportError } from '../lib/logger'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'
import { useStickersStatus } from '../state/selectors'

type ChallengeCompletionInsert =
  Database['public']['Tables']['user_challenge_completions']['Insert']

const STORAGE_KEY = (userId: string) => `challenge_completions_v1_${userId}`

function loadCompleted(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(userId))
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function saveCompleted(userId: string, ids: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY(userId), JSON.stringify([...ids]))
  } catch { /* storage quota */ }
}

async function persistToSupabase(userId: string, challengeId: string): Promise<void> {
  const row: ChallengeCompletionInsert = { user_id: userId, challenge_id: challengeId }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('user_challenge_completions').upsert(row)
}

export function useChallengeCompletion(userId: string): {
  activeCompletion: Challenge | null
  dismissCompletion: () => void
} {
  const results = useChallengeProgress()
  const { status } = useStickersStatus()
  const seededRef = useRef(false)
  const persistedRef = useRef<Set<string>>(new Set())
  const [queue, setQueue] = useState<Challenge[]>([])

  // Seed persisted set once per userId
  useEffect(() => {
    persistedRef.current = loadCompleted(userId)
    seededRef.current = false
    setQueue([])
  }, [userId])

  useEffect(() => {
    // Wait until stickers are loaded; otherwise we'd seed an empty baseline and
    // then fire modals for every already-completed challenge on the next render.
    if (status !== 'ready') return
    if (!seededRef.current) {
      // First render after load: establish baseline without firing modals
      seededRef.current = true
      const nowCompleted = results.filter(r => r.completed).map(r => r.challenge.id)
      const updated = new Set([...persistedRef.current, ...nowCompleted])
      persistedRef.current = updated
      saveCompleted(userId, updated)
      return
    }

    const newlyCompleted: ChallengeResult[] = results.filter(
      r => r.completed && !persistedRef.current.has(r.challenge.id),
    )

    if (newlyCompleted.length === 0) return

    const toAdd: Challenge[] = []
    for (const r of newlyCompleted) {
      persistedRef.current.add(r.challenge.id)
      toAdd.push(r.challenge)
      void persistToSupabase(userId, r.challenge.id).catch((err) => {
        reportError('challenge completion persist failed', err, {
          feature: 'challenges',
          action: 'persist_completion',
        }, { challenge_id: r.challenge.id })
      })
      telemetry.track(AnalyticsEvent.CHALLENGE_COMPLETED, {
        challenge_id: r.challenge.id,
        challenge_title: r.challenge.title,
        difficulty: r.challenge.difficulty,
      })
    }
    saveCompleted(userId, persistedRef.current)

    setQueue(q => {
      const existing = new Set(q.map(c => c.id))
      const merged = [...q]
      for (const c of toAdd) {
        if (!existing.has(c.id)) merged.push(c)
      }
      return merged
    })
  }, [results, userId, status])

  const dismissCompletion = useCallback(() => {
    setQueue(q => q.slice(1))
  }, [])

  return { activeCompletion: queue[0] ?? null, dismissCompletion }
}
