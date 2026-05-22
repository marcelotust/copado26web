import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { AnalyticsEvent, telemetry } from '../../lib/telemetry'
import type { FriendEntry } from './types'

type FriendsState = { friends: FriendEntry[]; loading: boolean; error: string | null }

export function useFriends() {
  const [state, setState] = useState<FriendsState>({ friends: [], loading: true, error: null })

  const fetchFriends = useCallback(async () => {
    setState(s => ({ ...s, loading: true }))
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_my_friends')
      if (error) throw error
      setState({ friends: (data as FriendEntry[] | null) ?? [], loading: false, error: null })
    } catch (err) {
      setState({ friends: [], loading: false, error: String(err) })
    }
  }, [])

  useEffect(() => { void fetchFriends() }, [fetchFriends])

  async function removeFriend(userId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.rpc as any)('remove_friend', { p_other_user: userId })
    telemetry.track(AnalyticsEvent.FRIEND_REMOVED)
    setState(s => ({ ...s, friends: s.friends.filter(f => f.user_id !== userId) }))
  }

  return { ...state, refetch: fetchFriends, removeFriend }
}
