import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type SentRequest = { to_user: string; created_at: string }

type State = { sentToIds: Set<string>; loading: boolean }

export function useSentFriendRequests(): State {
  const [state, setState] = useState<State>({ sentToIds: new Set(), loading: true })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.rpc as any)('get_sent_friend_requests')
        if (cancelled) return
        if (error) throw error
        const ids = new Set<string>((data as SentRequest[] ?? []).map(r => r.to_user))
        setState({ sentToIds: ids, loading: false })
      } catch {
        if (!cancelled) setState({ sentToIds: new Set(), loading: false })
      }
    })()
    return () => { cancelled = true }
  }, [])

  return state
}
