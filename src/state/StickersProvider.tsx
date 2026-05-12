// Single source of truth for catalog + user state.
// One realtime channel, optimistic writes via adjust_sticker RPC.

import {
  createContext, useCallback, useContext, useMemo, useReducer, useRef,
  type ReactNode,
} from 'react'
import { supabase, adjustStickerRpc } from '../lib/supabase'
import { initialState, reducer } from './stickersReducer'
import { useStickersLoad } from './useStickersLoad'
import { useStickersRealtime } from './useStickersRealtime'
import type { ContextValue } from './stickersTypes'

export const StickersContext = createContext<ContextValue | null>(null)

export function useStickersContext(): ContextValue {
  const ctx = useContext(StickersContext)
  if (!ctx) throw new Error('useStickers must be used inside <StickersProvider>')
  return ctx
}

export function StickersProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  // Pending optimistic writes: sticker_id → ignore conflicting realtime echoes
  const pendingRef = useRef<Map<string, number>>(new Map())

  useStickersLoad(userId, dispatch)
  useStickersRealtime(userId, pendingRef, dispatch)

  const adjust = useCallback(async (stickerId: string, delta: number): Promise<number | null> => {
    const previous = state.quantities.get(stickerId) ?? 0
    const optimistic = Math.max(0, previous + delta)
    pendingRef.current.set(stickerId, (pendingRef.current.get(stickerId) ?? 0) + 1)
    dispatch({ type: 'SET_QUANTITY', id: stickerId, qty: optimistic })

    const { data, error } = await adjustStickerRpc(stickerId, delta)

    const remaining = (pendingRef.current.get(stickerId) ?? 1) - 1
    if (remaining <= 0) pendingRef.current.delete(stickerId)
    else pendingRef.current.set(stickerId, remaining)

    if (error) {
      console.error('[stickers] adjust failed', error)
      dispatch({ type: 'SET_QUANTITY', id: stickerId, qty: previous })
      throw error
    }
    if (typeof data === 'number' && data !== optimistic) {
      dispatch({ type: 'SET_QUANTITY', id: stickerId, qty: data })
    }
    return data ?? null
  }, [state.quantities])

  const resetAll = useCallback(async (): Promise<void> => {
    const { error } = await supabase.from('user_stickers').delete().eq('user_id', userId)
    if (error) throw error
    dispatch({ type: 'CLEAR_ALL_QUANTITIES' })
  }, [userId])

  const value = useMemo<ContextValue>(() => ({ ...state, adjust, resetAll }), [state, adjust, resetAll])
  return <StickersContext.Provider value={value}>{children}</StickersContext.Provider>
}
