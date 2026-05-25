// Single source of truth for catalog + user state.
// One realtime channel, optimistic writes via adjust_sticker RPC.

import {
  createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState,
  type ReactNode,
} from 'react'
import { resetMyAlbumRpc, logAuditEvent } from '../lib/audit'
import { supabase, adjustStickerRpc, applyTradeRpc, type TradeResultRow } from '../lib/supabase'
import { buildAlbumCsv } from '../lib/albumCsv'
import { clearUserProgressCaches } from '../lib/userProgressStorage'
import { upsertTodayAlbumBackup } from '../lib/albumBackupStorage'
import { errorCodeFrom, logger, reportError } from '../lib/logger'
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
  const [progressGeneration, setProgressGeneration] = useState(0)
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
        } catch {
          logger.warn('local album backup save failed', { feature: 'album', action: 'backup_save' })
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
      const code = errorCodeFrom(error)
      reportError('adjust sticker failed', error, { feature: 'stickers', action: 'adjust', error_code: code }, { sticker_id: stickerId, delta })
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

  const applyTrade = useCallback(
    async (received: string[], given: string[]): Promise<TradeResultRow[]> => {
      // Net delta per sticker so the same id in both lists cancels out.
      const deltas = new Map<string, number>()
      for (const id of received) deltas.set(id, (deltas.get(id) ?? 0) + 1)
      for (const id of given) deltas.set(id, (deltas.get(id) ?? 0) - 1)

      const previous = new Map<string, number>()
      for (const [id, delta] of deltas) {
        if (delta === 0) continue
        const prev = state.quantities.get(id) ?? 0
        previous.set(id, prev)
        pendingRef.current.set(id, (pendingRef.current.get(id) ?? 0) + 1)
        dispatch({ type: 'SET_QUANTITY', id, qty: Math.max(0, prev + delta) })
      }

      const { data, error } = await applyTradeRpc(received, given)

      for (const id of previous.keys()) {
        const remaining = (pendingRef.current.get(id) ?? 1) - 1
        if (remaining <= 0) pendingRef.current.delete(id)
        else pendingRef.current.set(id, remaining)
      }

      if (error) {
        const code = errorCodeFrom(error)
        reportError('apply trade failed', error, { feature: 'stickers', action: 'apply_trade', error_code: code }, { received: received.length, given: given.length })
        telemetry.track(AnalyticsEvent.STICKER_UPDATE_FAILED, { action: 'apply_trade', error_code: code })
        for (const [id, prev] of previous) dispatch({ type: 'SET_QUANTITY', id, qty: prev })
        throw error
      }

      const rows = data ?? []
      for (const row of rows) dispatch({ type: 'SET_QUANTITY', id: row.sticker_id, qty: row.quantity })

      if (state.status === 'ready') {
        const next = new Map(state.quantities)
        for (const [id, delta] of deltas) {
          if (delta !== 0) next.set(id, Math.max(0, (state.quantities.get(id) ?? 0) + delta))
        }
        for (const row of rows) {
          if (row.quantity <= 0) next.delete(row.sticker_id)
          else next.set(row.sticker_id, row.quantity)
        }
        scheduleLocalDailyBackup(state.catalog, next)
      }

      return rows
    },
    [state.catalog, state.quantities, state.status, scheduleLocalDailyBackup],
  )

  const resetAll = useCallback(async (): Promise<void> => {
    await resetMyAlbumRpc()
    dispatch({ type: 'CLEAR_ALL_QUANTITIES' })
    clearUserProgressCaches(userId)
    setProgressGeneration(g => g + 1)
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
      await logAuditEvent('album_import_replace', { sticker_rows: positive.size })
    } catch {
      logger.warn('audit log after import failed', { feature: 'album', action: 'audit_import' })
    }

    try {
      upsertTodayAlbumBackup(userId, buildAlbumCsv(state.catalog, positive))
    } catch {
      logger.warn('album backup after import failed', { feature: 'album', action: 'backup_after_import' })
    }
  }, [userId, state.catalog])

  const value = useMemo<ContextValue>(
    () => ({ ...state, userId, progressGeneration, adjust, applyTrade, resetAll, replaceAllQuantities }),
    [state, userId, progressGeneration, adjust, applyTrade, resetAll, replaceAllQuantities],
  )
  return (
    <StickersContext.Provider value={value}>
      {children}
    </StickersContext.Provider>
  )
}
