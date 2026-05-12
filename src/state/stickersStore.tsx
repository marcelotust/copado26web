// Single source of truth for catalog + user state.
// One realtime channel, optimistic writes via adjust_sticker RPC.
//
// Catalog (teams, stickers_catalog) is loaded once after the user signs in.
// user_stickers is sparse: a row only exists for stickers the user has
// collected at least once.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import { supabase, adjustStickerRpc } from '../lib/supabase'
import type { CatalogSticker, Sticker, Team } from '../types/database'

type Status = 'idle' | 'loading' | 'ready' | 'error'

type State = {
  teams:      Team[]
  catalog:    Map<string, CatalogSticker>
  byTeam:     Map<string, string[]>
  quantities: Map<string, number>
  status:     Status
  error:      Error | null
}

type Action =
  | { type: 'STATUS'; status: Status; error?: Error | null }
  | { type: 'CATALOG_LOADED'; teams: Team[]; stickers: CatalogSticker[] }
  | { type: 'QUANTITIES_LOADED'; rows: { sticker_id: string; quantity: number }[] }
  | { type: 'SET_QUANTITY'; id: string; qty: number }
  | { type: 'CLEAR_ALL_QUANTITIES' }

const initial: State = {
  teams:      [],
  catalog:    new Map(),
  byTeam:     new Map(),
  quantities: new Map(),
  status:     'idle',
  error:      null,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'STATUS':
      return { ...state, status: action.status, error: action.error ?? null }

    case 'CATALOG_LOADED': {
      const catalog = new Map<string, CatalogSticker>(action.stickers.map(s => [s.id, s]))
      const byTeam  = new Map<string, string[]>()
      for (const s of action.stickers) {
        let list = byTeam.get(s.team_code)
        if (!list) { list = []; byTeam.set(s.team_code, list) }
        list.push(s.id)
      }
      for (const list of byTeam.values()) {
        list.sort((a, b) => (catalog.get(a)?.number ?? 0) - (catalog.get(b)?.number ?? 0))
      }
      return { ...state, teams: action.teams, catalog, byTeam }
    }

    case 'QUANTITIES_LOADED': {
      const quantities = new Map<string, number>()
      for (const row of action.rows) {
        if (row.quantity > 0) quantities.set(row.sticker_id, row.quantity)
      }
      return { ...state, quantities, status: 'ready' }
    }

    case 'SET_QUANTITY': {
      const next = new Map(state.quantities)
      if (action.qty <= 0) next.delete(action.id)
      else next.set(action.id, action.qty)
      return { ...state, quantities: next }
    }

    case 'CLEAR_ALL_QUANTITIES':
      return { ...state, quantities: new Map() }

    default:
      return state
  }
}

type ContextValue = State & {
  adjust: (stickerId: string, delta: number) => Promise<number | null>
  resetAll: () => Promise<void>
}

const StickersContext = createContext<ContextValue | null>(null)

export function StickersProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial)
  // Pending optimistic writes: sticker_id we own locally → ignore conflicting realtime updates
  const pendingRef = useRef<Map<string, number>>(new Map())

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    dispatch({ type: 'STATUS', status: 'loading' })

    ;(async () => {
      try {
        const [{ data: teams, error: e1 }, { data: stickers, error: e2 }] = await Promise.all([
          supabase.from('teams').select('*').order('sort_order'),
          supabase.from('stickers_catalog').select('*').order('sort_order'),
        ])
        if (cancelled) return
        if (e1 || e2) throw e1 ?? e2
        if (!teams?.length || !stickers?.length) throw new Error('catalog is empty')
        dispatch({ type: 'CATALOG_LOADED', teams, stickers })

        const { data: rows, error: e3 } = await supabase
          .from('user_stickers')
          .select('sticker_id, quantity')
          .eq('user_id', userId)
        if (cancelled) return
        if (e3) throw e3
        dispatch({ type: 'QUANTITIES_LOADED', rows: rows ?? [] })
      } catch (err) {
        if (!cancelled) {
          console.error('[stickers] load failed', err)
          dispatch({ type: 'STATUS', status: 'error', error: err as Error })
        }
      }
    })()

    return () => { cancelled = true }
  }, [userId])

  // ── Single realtime channel ───────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`user-stickers-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_stickers',
          filter: `user_id=eq.${userId}`,
        },
        (payload: {
          eventType: 'INSERT' | 'UPDATE' | 'DELETE'
          new: { sticker_id?: string; quantity?: number } | null
          old: { sticker_id?: string } | null
        }) => {
          const row = payload.new ?? payload.old
          if (!row?.sticker_id) return
          if (pendingRef.current.has(row.sticker_id)) return
          const qty = payload.eventType === 'DELETE' ? 0 : (payload.new?.quantity ?? 0)
          dispatch({ type: 'SET_QUANTITY', id: row.sticker_id, qty })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  // ── Mutations ─────────────────────────────────────────────────────────────
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
    const { error } = await supabase
      .from('user_stickers')
      .delete()
      .eq('user_id', userId)
    if (error) throw error
    dispatch({ type: 'CLEAR_ALL_QUANTITIES' })
  }, [userId])

  const value = useMemo<ContextValue>(() => ({
    teams:      state.teams,
    catalog:    state.catalog,
    byTeam:     state.byTeam,
    quantities: state.quantities,
    status:     state.status,
    error:      state.error,
    adjust,
    resetAll,
  }), [state, adjust, resetAll])

  return <StickersContext.Provider value={value}>{children}</StickersContext.Provider>
}

// ── Selectors ────────────────────────────────────────────────────────────────

function useStickersContext(): ContextValue {
  const ctx = useContext(StickersContext)
  if (!ctx) throw new Error('useStickers must be used inside <StickersProvider>')
  return ctx
}

export function useStickersStatus(): { status: Status; error: Error | null } {
  const { status, error } = useStickersContext()
  return { status, error }
}

export function useTeams(): Team[] {
  return useStickersContext().teams
}

export function useTeam(code: string): Team | null {
  const teams = useTeams()
  return teams.find(t => t.code === code) ?? null
}

export function useSectionStickers(teamCode: string): Sticker[] {
  const { catalog, byTeam, quantities } = useStickersContext()
  return useMemo(() => {
    const ids = byTeam.get(teamCode) ?? []
    return ids.flatMap(id => {
      const c = catalog.get(id)
      return c ? [{ ...c, quantity: quantities.get(id) ?? 0 }] : []
    })
  }, [catalog, byTeam, quantities, teamCode])
}

export function useSectionProgress(teamCode: string): { total: number; collected: number } {
  const { byTeam, quantities } = useStickersContext()
  const ids = byTeam.get(teamCode) ?? []
  let collected = 0
  for (const id of ids) if ((quantities.get(id) ?? 0) >= 1) collected++
  return { total: ids.length, collected }
}

export function useAlbumProgress(): { total: number; collected: number; swaps: number } {
  const { catalog, quantities } = useStickersContext()
  let collected = 0
  let swaps = 0
  for (const qty of quantities.values()) {
    if (qty >= 1) collected++
    if (qty > 1) swaps += qty - 1
  }
  return { total: catalog.size, collected, swaps }
}

export type SwapGroup = { teamCode: string; stickers: Sticker[] }

export function useSwaps(): { swapsByTeam: SwapGroup[]; total: number } {
  const { teams, catalog, byTeam, quantities } = useStickersContext()
  return useMemo(() => {
    const groups: SwapGroup[] = []
    let total = 0
    for (const team of teams) {
      const ids = byTeam.get(team.code) ?? []
      const stickers: Sticker[] = []
      for (const id of ids) {
        const qty = quantities.get(id) ?? 0
        if (qty > 1) {
          const c = catalog.get(id)
          if (!c) continue
          stickers.push({ ...c, quantity: qty })
          total += qty - 1
        }
      }
      if (stickers.length) groups.push({ teamCode: team.code, stickers })
    }
    return { swapsByTeam: groups, total }
  }, [teams, catalog, byTeam, quantities])
}

export type MissingGroup = { teamCode: string; numbers: number[] }

export function useMissing(): MissingGroup[] {
  const { teams, catalog, byTeam, quantities } = useStickersContext()
  return useMemo(() => {
    const groups: MissingGroup[] = []
    for (const team of teams) {
      const ids = byTeam.get(team.code) ?? []
      const numbers: number[] = []
      for (const id of ids) {
        if ((quantities.get(id) ?? 0) === 0) {
          const c = catalog.get(id)
          if (c) numbers.push(c.number)
        }
      }
      if (numbers.length) groups.push({ teamCode: team.code, numbers })
    }
    return groups
  }, [teams, catalog, byTeam, quantities])
}

export function useAdjustSticker() {
  return useStickersContext().adjust
}

export function useResetAlbum() {
  return useStickersContext().resetAll
}

export function useCatalogSnapshot(): ContextValue {
  return useStickersContext()
}
