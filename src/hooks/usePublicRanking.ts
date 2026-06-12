import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type RankingEntry = {
  user_id: string
  nickname: string
  display_name: string
  avatar_url: string | null
  avatar_palette_id: number | null
  owned_count: number
  completion_pct: number
  rank: number
  completed_at: string | null
}

type State = { entries: RankingEntry[]; loading: boolean; error: string | null }

export function usePublicRanking() {
  const [state, setState] = useState<State>({ entries: [], loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    setState({ entries: [], loading: true, error: null })
    ;(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.rpc as any)('get_public_ranking')
        if (cancelled) return
        if (error) throw error
        setState({ entries: (data as RankingEntry[]) ?? [], loading: false, error: null })
      } catch (err) {
        if (!cancelled) setState({ entries: [], loading: false, error: String(err) })
      }
    })()
    return () => { cancelled = true }
  }, [])

  return state
}
