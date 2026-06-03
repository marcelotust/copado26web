import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export type SentRequest = {
  to_user: string
  created_at: string
  nickname: string | null
  display_name: string | null
  avatar_url: string | null
  avatar_palette_id: number | null
}

type State = { requests: SentRequest[]; sentToIds: Set<string>; loading: boolean }

export function useSentFriendRequests(): State {
  const [state, setState] = useState<State>({ requests: [], sentToIds: new Set(), loading: true })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.rpc as any)('get_sent_friend_requests')
        if (cancelled) return
        if (error) throw error
        const reqs = (data as SentRequest[]) ?? []
        setState({
          requests: reqs,
          sentToIds: new Set(reqs.map(r => r.to_user)),
          loading: false,
        })
      } catch {
        if (!cancelled) setState({ requests: [], sentToIds: new Set(), loading: false })
      }
    })()
    return () => { cancelled = true }
  }, [])

  return state
}
