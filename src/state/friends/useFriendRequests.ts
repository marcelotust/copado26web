import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { AnalyticsEvent, telemetry } from '../../lib/telemetry'
import type { FriendRequests } from './types'

const SEEN_KEY = 'friends_pending_last_seen_count_v1'

function getLastSeenCount(): number {
  try { return parseInt(localStorage.getItem(SEEN_KEY) ?? '0', 10) || 0 } catch { return 0 }
}
function saveSeenCount(n: number): void {
  try { localStorage.setItem(SEEN_KEY, String(n)) } catch { /* private mode */ }
}

type State = { data: FriendRequests | null; loading: boolean; error: string | null }

export function useFriendRequests() {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null })
  const prevPendingCount = useRef(getLastSeenCount())

  const fetchRequests = useCallback(async () => {
    setState(s => ({ ...s, loading: true }))
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_friend_requests')
      if (error) throw error
      const result = data as FriendRequests
      setState({ data: result, loading: false, error: null })

      const currentCount = result?.pending?.length ?? 0
      const prev = prevPendingCount.current
      if (currentCount > prev) {
        telemetry.track(AnalyticsEvent.FRIEND_REQUEST_RECEIVED, { count: currentCount - prev })
      }
      prevPendingCount.current = currentCount
      saveSeenCount(currentCount)
    } catch (err) {
      setState({ data: null, loading: false, error: String(err) })
    }
  }, [])

  useEffect(() => { void fetchRequests() }, [fetchRequests])

  async function acceptRequest(requestId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('accept_friend_request', { p_request_id: requestId })
    if (error) throw error
    telemetry.track(AnalyticsEvent.FRIEND_REQUEST_ACCEPTED)
    await fetchRequests()
  }

  async function declineRequest(requestId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.rpc as any)('decline_friend_request', { p_request_id: requestId })
    telemetry.track(AnalyticsEvent.FRIEND_REQUEST_DECLINED)
    setState(s => s.data ? {
      ...s,
      data: { ...s.data, pending: s.data.pending.filter(r => r.id !== requestId) },
    } : s)
  }

  return { ...state, refetch: fetchRequests, acceptRequest, declineRequest }
}
