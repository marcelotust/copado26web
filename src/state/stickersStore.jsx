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
} from 'react'
import { supabase } from '../lib/supabase'

/** @typedef {{ code: string, name_key: string, flag: string, conf: string, group_letter: string|null, sort_order: number }} Team */
/** @typedef {{ id: string, team_code: string, number: number, player_name: string|null, is_special: boolean, sort_order: number }} CatalogSticker */
/** @typedef {CatalogSticker & { quantity: number }} Sticker */

const StickersContext = createContext(/** @type {any} */ (null))

const initial = {
  teams:      /** @type {Team[]} */ ([]),
  catalog:    /** @type {Map<string, CatalogSticker>} */ (new Map()),
  byTeam:     /** @type {Map<string, string[]>} */ (new Map()),
  quantities: /** @type {Map<string, number>} */ (new Map()),
  status:     /** @type {'idle'|'loading'|'ready'|'error'} */ ('idle'),
  error:      /** @type {Error|null} */ (null),
}

function reducer(state, action) {
  switch (action.type) {
    case 'STATUS':
      return { ...state, status: action.status, error: action.error ?? null }

    case 'CATALOG_LOADED': {
      const catalog = new Map(action.stickers.map(s => [s.id, s]))
      const byTeam  = new Map()
      for (const s of action.stickers) {
        let list = byTeam.get(s.team_code)
        if (!list) { list = []; byTeam.set(s.team_code, list) }
        list.push(s.id)
      }
      for (const list of byTeam.values()) {
        list.sort((a, b) => catalog.get(a).number - catalog.get(b).number)
      }
      return { ...state, teams: action.teams, catalog, byTeam }
    }

    case 'QUANTITIES_LOADED': {
      const quantities = new Map()
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

/** @param {{ userId: string, children: import('react').ReactNode }} props */
export function StickersProvider({ userId, children }) {
  const [state, dispatch] = useReducer(reducer, initial)
  // Pending optimistic writes: sticker_id we own locally → ignore conflicting realtime updates
  const pendingRef = useRef(/** @type {Map<string, number>} */ (new Map()))

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
          dispatch({ type: 'STATUS', status: 'error', error: err })
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
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_stickers',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const row = payload.new ?? payload.old
        if (!row?.sticker_id) return
        // Drop server echoes while a local write is still pending for this sticker
        if (pendingRef.current.has(row.sticker_id)) return
        const qty = payload.eventType === 'DELETE' ? 0 : (payload.new?.quantity ?? 0)
        dispatch({ type: 'SET_QUANTITY', id: row.sticker_id, qty })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  // ── Mutations ─────────────────────────────────────────────────────────────
  const adjust = useCallback(async (/** @type {string} */ stickerId, /** @type {number} */ delta) => {
    const previous = state.quantities.get(stickerId) ?? 0
    const optimistic = Math.max(0, previous + delta)
    pendingRef.current.set(stickerId, (pendingRef.current.get(stickerId) ?? 0) + 1)
    dispatch({ type: 'SET_QUANTITY', id: stickerId, qty: optimistic })

    const { data, error } = await supabase.rpc('adjust_sticker', {
      p_sticker_id: stickerId,
      p_delta: delta,
    })

    // Drop the pending counter; if it hits zero we let realtime drive again
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
    return data
  }, [state.quantities])

  const resetAll = useCallback(async () => {
    const { error } = await supabase
      .from('user_stickers')
      .delete()
      .eq('user_id', userId)
    if (error) throw error
    dispatch({ type: 'CLEAR_ALL_QUANTITIES' })
  }, [userId])

  const value = useMemo(() => ({
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

function useStickersContext() {
  const ctx = useContext(StickersContext)
  if (!ctx) throw new Error('useStickers must be used inside <StickersProvider>')
  return ctx
}

export function useStickersStatus() {
  const { status, error } = useStickersContext()
  return { status, error }
}

export function useTeams() {
  return useStickersContext().teams
}

/** @param {string} code */
export function useTeam(code) {
  const teams = useTeams()
  return teams.find(t => t.code === code) ?? null
}

/** @param {string} teamCode @returns {Sticker[]} */
export function useSectionStickers(teamCode) {
  const { catalog, byTeam, quantities } = useStickersContext()
  return useMemo(() => {
    const ids = byTeam.get(teamCode) ?? []
    return ids.map(id => {
      const c = catalog.get(id)
      return /** @type {Sticker} */ ({ ...c, quantity: quantities.get(id) ?? 0 })
    })
  }, [catalog, byTeam, quantities, teamCode])
}

/** @param {string} teamCode */
export function useSectionProgress(teamCode) {
  const { byTeam, quantities } = useStickersContext()
  const ids = byTeam.get(teamCode) ?? []
  let collected = 0
  for (const id of ids) if ((quantities.get(id) ?? 0) >= 1) collected++
  return { total: ids.length, collected }
}

export function useAlbumProgress() {
  const { catalog, quantities } = useStickersContext()
  let collected = 0
  let swaps = 0
  for (const qty of quantities.values()) {
    if (qty >= 1) collected++
    if (qty > 1) swaps += qty - 1
  }
  return { total: catalog.size, collected, swaps }
}

/** @returns {{ swapsByTeam: { teamCode: string, stickers: Sticker[] }[], total: number }} */
export function useSwaps() {
  const { teams, catalog, byTeam, quantities } = useStickersContext()
  return useMemo(() => {
    const groups = []
    let total = 0
    for (const team of teams) {
      const ids = byTeam.get(team.code) ?? []
      const stickers = []
      for (const id of ids) {
        const qty = quantities.get(id) ?? 0
        if (qty > 1) {
          stickers.push({ ...catalog.get(id), quantity: qty })
          total += qty - 1
        }
      }
      if (stickers.length) groups.push({ teamCode: team.code, stickers })
    }
    return { swapsByTeam: groups, total }
  }, [teams, catalog, byTeam, quantities])
}

/** @returns {{ teamCode: string, numbers: number[] }[]} */
export function useMissing() {
  const { teams, catalog, byTeam, quantities } = useStickersContext()
  return useMemo(() => {
    const groups = []
    for (const team of teams) {
      const ids = byTeam.get(team.code) ?? []
      const numbers = []
      for (const id of ids) {
        if ((quantities.get(id) ?? 0) === 0) numbers.push(catalog.get(id).number)
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

export function useCatalogSnapshot() {
  // For export use cases that need the raw catalog rows + quantities
  return useStickersContext()
}
