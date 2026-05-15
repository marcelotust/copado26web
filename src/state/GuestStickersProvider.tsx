import { useEffect, useReducer, useMemo, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { StickersContext } from './StickersProvider'
import { initialState, reducer } from './stickersReducer'
import { errorCodeFrom, reportError } from '../lib/logger'
import type { PaywallReason } from '../contexts/PaywallContext'

type Props = {
  onPaywall: (reason: PaywallReason) => void
  children: ReactNode
}

export function GuestStickersProvider({ onPaywall, children }: Props) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
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
        dispatch({ type: 'QUANTITIES_LOADED', rows: [] }) // all qty=0, transitions status to 'ready'
      } catch (err) {
        if (cancelled) return
        reportError('guest catalog load failed', err, {
          feature: 'stickers',
          action: 'guest_load',
          error_code: errorCodeFrom(err),
        })
        dispatch({ type: 'STATUS', status: 'error', error: err as Error })
      }
    })()
    return () => { cancelled = true }
  }, [])

  const value = useMemo(() => ({
    ...state,
    userId: 'guest',
    adjust: async (_id: string, _delta: number) => {
      onPaywall('sticker_toggle')
      return null
    },
    resetAll: async () => {},
    replaceAllQuantities: async () => {},
  }), [state, onPaywall])

  return (
    <StickersContext.Provider value={value}>
      {children}
    </StickersContext.Provider>
  )
}
