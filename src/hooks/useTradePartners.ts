import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type TradePartner = {
  user_id: string
  nickname: string
  display_name: string
  avatar_url: string | null
  completion_pct: number
  they_have_i_need: number
  i_have_they_need: number
}

type State = { partners: TradePartner[]; loading: boolean; error: string | null }

export function useTradePartners() {
  const [state, setState] = useState<State>({ partners: [], loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    setState({ partners: [], loading: true, error: null })
    ;(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.rpc as any)('get_best_trade_partners')
        if (cancelled) return
        if (error) throw error
        const partners = ((data as TradePartner[]) ?? [])
          .slice()
          .sort((a, b) =>
            b.they_have_i_need - a.they_have_i_need
            || b.i_have_they_need - a.i_have_they_need,
          )
        setState({ partners, loading: false, error: null })
      } catch (err) {
        if (!cancelled) setState({ partners: [], loading: false, error: String(err) })
      }
    })()
    return () => { cancelled = true }
  }, [])

  return state
}
