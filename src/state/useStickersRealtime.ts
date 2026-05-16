import { useEffect, type RefObject } from 'react'
import { logger } from '../lib/logger'
import { supabase } from '../lib/supabase'
import type { Action } from './stickersTypes'

type RealtimePayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: { sticker_id?: string; quantity?: number } | null
  old: { sticker_id?: string } | null
}

// Subscribes to user_stickers changes for the given user and dispatches
// SET_QUANTITY whenever a row not currently being written locally changes.

export function useStickersRealtime(
  userId: string | undefined,
  pendingRef: RefObject<Map<string, number>>,
  dispatch: (action: Action) => void,
) {
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`user-stickers-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_stickers',
        filter: `user_id=eq.${userId}`,
      }, (payload: RealtimePayload) => {
        const row = payload.new ?? payload.old
        if (!row?.sticker_id) return
        if (pendingRef.current?.has(row.sticker_id)) return
        const qty = payload.eventType === 'DELETE' ? 0 : (payload.new?.quantity ?? 0)
        dispatch({ type: 'SET_QUANTITY', id: row.sticker_id, qty })
      })
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          logger.warn('realtime subscription failed', {
            feature: 'stickers',
            action: 'realtime_subscribe',
            error_code: status,
          }, {
            reason: err instanceof Error ? err.message : String(err ?? status),
          })
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [userId, pendingRef, dispatch])
}
