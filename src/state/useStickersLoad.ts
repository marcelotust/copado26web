import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { errorCodeFrom, reportError } from '../lib/logger'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'
import type { Action } from './stickersTypes'

// Fetches the catalog (teams + stickers_catalog) and the user's quantities,
// dispatching loading / loaded / error states along the way.

export function useStickersLoad(userId: string | undefined, dispatch: (action: Action) => void) {
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
        telemetry.track(AnalyticsEvent.ALBUM_SEEDED, { sticker_count: stickers.length })
      } catch (err) {
        if (cancelled) return
        const code = errorCodeFrom(err)
        reportError('catalog load failed', err, { feature: 'stickers', action: 'load', error_code: code })
        telemetry.track(AnalyticsEvent.ALBUM_SEED_FAILED, { error_code: code })
        dispatch({ type: 'STATUS', status: 'error', error: err as Error })
      }
    })()

    return () => { cancelled = true }
  }, [userId, dispatch])
}
