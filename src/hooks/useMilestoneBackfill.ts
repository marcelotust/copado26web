import { useEffect } from 'react'
import { useAlbumProgress, useTeams, useStickersStatus } from '../state/stickersStore'
import { useStickersContext } from '../state/StickersProvider'
import { loadPersistedMilestones, backfillMilestones, type PersistedMilestone } from '../lib/milestoneStorage'

const ALBUM_THRESHOLDS = [25, 50, 75, 100] as const
const SPECIAL_CODES = new Set(['WAP', 'FWC', 'CC'])

/**
 * Cross-device milestone backfill (temporary workaround).
 *
 * Problem: milestone events are stored in localStorage, which is device-local.
 * A user logging in on a new device has no milestone history even though their
 * album progress (stored in Supabase) shows they've earned several milestones.
 *
 * Temporary fix: on first load of a device with empty localStorage, derive which
 * milestones the user must have earned from their current Supabase progress and
 * write them to localStorage with synthetic timestamps (spaced 1 min apart,
 * ordered chronologically: lowest album threshold first, then teams by sort_order).
 *
 * Limitations of this approach:
 * - Ordering is approximate (based on logical progression, not actual timestamps)
 * - Only runs once per device per user — subsequent milestones are tracked normally
 * - Does NOT show the celebration modal for backfilled milestones (intentional)
 *
 * Proper long-term fix: persist milestone events to Supabase (user_metadata or
 * a dedicated table) so they sync across devices with real timestamps.
 */
export function useMilestoneBackfill(userId: string): void {
  const { status } = useStickersStatus()
  const { total, collected } = useAlbumProgress()
  const teams = useTeams()
  const { byTeam, quantities } = useStickersContext()

  useEffect(() => {
    if (status !== 'ready' || total === 0) return

    // Only backfill when localStorage has no milestone history for this user
    if (loadPersistedMilestones(userId).length > 0) return

    const albumPct = Math.round((collected / total) * 100)
    if (albumPct === 0) return

    const events: PersistedMilestone[] = []

    // Album thresholds — ordered from lowest to highest (chronological)
    for (const threshold of ALBUM_THRESHOLDS) {
      if (albumPct >= threshold) {
        events.push({ kind: 'album', pct: threshold, at: 0 })
      }
    }

    // Completed teams — ordered by album sort_order (approximate chronological order)
    const sortedTeams = [...teams]
      .filter(tm => !SPECIAL_CODES.has(tm.code))
      .sort((a, b) => a.sort_order - b.sort_order)

    for (const tm of sortedTeams) {
      const ids = byTeam.get(tm.code) ?? []
      const teamCollected = ids.filter(id => (quantities.get(id) ?? 0) >= 1).length
      if (ids.length > 0 && teamCollected >= ids.length) {
        events.push({ kind: 'team', teamCode: tm.code, at: 0 })
      }
    }

    if (events.length === 0) return

    // Assign synthetic timestamps: 1 min apart, oldest first, newest = now
    const now = Date.now()
    const timestamped = events.map((e, i): PersistedMilestone => {
      const at = now - (events.length - i) * 60_000
      return e.kind === 'album'
        ? { kind: 'album', pct: e.pct, at }
        : { kind: 'team', teamCode: e.teamCode, at }
    })

    backfillMilestones(userId, timestamped)
  }, [status, userId, total, collected, teams, byTeam, quantities])
}
