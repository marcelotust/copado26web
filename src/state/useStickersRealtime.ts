import { useEffect, type RefObject } from 'react'
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
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, pendingRef, dispatch])
}
