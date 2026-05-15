// Single source of truth for catalog + user state.
// One realtime channel, optimistic writes via adjust_sticker RPC.

import {
  createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef,
  type ReactNode,
} from 'react'
import { supabase, adjustStickerRpc } from '../lib/supabase'
import { buildAlbumCsv } from '../lib/albumCsv'
import { upsertTodayAlbumBackup } from '../lib/albumBackupStorage'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'
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
  const backupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (backupTimerRef.current) clearTimeout(backupTimerRef.current)
  }, [])

  const scheduleLocalDailyBackup = useCallback(
    (catalog: typeof state.catalog, quantities: Map<string, number>) => {
      if (backupTimerRef.current) clearTimeout(backupTimerRef.current)
      backupTimerRef.current = setTimeout(() => {
        backupTimerRef.current = null
        try {
          upsertTodayAlbumBackup(userId, buildAlbumCsv(catalog, quantities))
        } catch (e) {
          console.warn('[album backup] save failed', e)
        }
      }, 900)
    },
    [userId],
  )

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
      const code = typeof error === 'object' && error && 'code' in error
        ? String((error as { code?: string }).code ?? 'unknown')
        : 'unknown'
      telemetry.error(error instanceof Error ? error : new Error('adjust_sticker rpc failed'), { sticker_id: stickerId, delta })
      telemetry.track(AnalyticsEvent.STICKER_UPDATE_FAILED, { action: 'adjust', error_code: code })
      dispatch({ type: 'SET_QUANTITY', id: stickerId, qty: previous })
      throw error
    }
    const resolved = typeof data === 'number' ? data : optimistic
    if (typeof data === 'number' && data !== optimistic) {
      dispatch({ type: 'SET_QUANTITY', id: stickerId, qty: data })
    }

    if (state.status === 'ready') {
      const next = new Map(state.quantities)
      if (resolved <= 0) next.delete(stickerId)
      else next.set(stickerId, resolved)
      scheduleLocalDailyBackup(state.catalog, next)
    }

    return data ?? null
  }, [state.catalog, state.quantities, state.status, scheduleLocalDailyBackup])

  const resetAll = useCallback(async (): Promise<void> => {
    const { error } = await supabase.from('user_stickers').delete().eq('user_id', userId)
    if (error) throw error
    dispatch({ type: 'CLEAR_ALL_QUANTITIES' })
  }, [userId])

  const replaceAllQuantities = useCallback(async (next: Map<string, number>): Promise<void> => {
    const positive = new Map<string, number>()
    for (const [id, q] of next) {
      if (q > 0) positive.set(id, q)
    }
    const { error: delErr } = await supabase.from('user_stickers').delete().eq('user_id', userId)
    if (delErr) throw delErr

    const rows = [...positive].map(([sticker_id, quantity]) => ({ user_id: userId, sticker_id, quantity }))
    const CHUNK = 120
    for (let i = 0; i < rows.length; i += CHUNK) {
      const slice = rows.slice(i, i + CHUNK)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insErr } = await supabase.from('user_stickers').insert(slice as any)
      if (insErr) throw insErr
    }

    dispatch({
      type: 'QUANTITIES_LOADED',
      rows: [...positive].map(([sticker_id, quantity]) => ({ sticker_id, quantity })),
    })

    try {
      upsertTodayAlbumBackup(userId, buildAlbumCsv(state.catalog, positive))
    } catch (e) {
      console.warn('[album backup] save after import failed', e)
    }
  }, [userId, state.catalog])

  const value = useMemo<ContextValue>(
    () => ({ ...state, userId, adjust, resetAll, replaceAllQuantities }),
    [state, userId, adjust, resetAll, replaceAllQuantities],
  )
  return (
    <StickersContext.Provider value={value}>
      {children}
    </StickersContext.Provider>
  )
}
