import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type MyRank = {
  rank: number
  owned_count: number
  completion_pct: number
}

type State = { myRank: MyRank | null; loading: boolean; error: string | null }

export function useMyRank() {
  const [state, setState] = useState<State>({ myRank: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    setState({ myRank: null, loading: true, error: null })
    ;(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.rpc as any)('get_my_rank')
        if (cancelled) return
        if (error) throw error
        setState({ myRank: (data as MyRank | null), loading: false, error: null })
      } catch (err) {
        if (!cancelled) setState({ myRank: null, loading: false, error: String(err) })
      }
    })()
    return () => { cancelled = true }
  }, [])

  return state
}
