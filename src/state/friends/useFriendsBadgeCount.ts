import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { FriendRequests } from './types'

/** Returns (pending_count + recently_accepted_count) for the header badge. */
export function useFriendsBadgeCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase.rpc as any)('get_friend_requests')
        if (cancelled) return
        const d = data as FriendRequests | null
        const pending = d?.pending?.length ?? 0
        const accepted = d?.recently_accepted?.length ?? 0
        setCount(pending + accepted)
      } catch {
        // silent — badge is non-critical
      }
    }

    void fetch()

    // Refetch on window focus
    const onFocus = () => { void fetch() }
    window.addEventListener('focus', onFocus)

    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  return count
}
