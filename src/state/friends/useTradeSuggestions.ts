import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { AnalyticsEvent, telemetry } from '../../lib/telemetry'
import type { TradeSuggestions } from './types'

type State = { data: TradeSuggestions | null; loading: boolean; error: string | null }

export function useTradeSuggestions(friendUserId: string | null) {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null })

  const fetchSuggestions = useCallback(async () => {
    if (!friendUserId) { setState({ data: null, loading: false, error: null }); return }
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('suggest_trades', {
        p_friend_user_id: friendUserId,
      })
      if (error) throw error
      const result = data as TradeSuggestions
      setState({ data: result, loading: false, error: null })
      if (result.ok) {
        telemetry.track(AnalyticsEvent.TRADE_SUGGESTION_VIEWED)
        telemetry.track(AnalyticsEvent.TRADE_SUGGESTION_MATCH_COUNT, {
          they_have_i_need_count: result.they_have_i_need.length,
          i_have_they_need_count: result.i_have_they_need.length,
        })
      }
    } catch (err) {
      setState({ data: null, loading: false, error: String(err) })
    }
  }, [friendUserId])

  useEffect(() => { void fetchSuggestions() }, [fetchSuggestions])

  return { ...state, refetch: fetchSuggestions }
}
