import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { AnalyticsEvent, telemetry } from '../../lib/telemetry'
import type { FriendProfile } from './types'

type State = { profile: FriendProfile | null; loading: boolean; error: string | null }

export function useFriendProfile(userId: string | null) {
  const [state, setState] = useState<State>({ profile: null, loading: true, error: null })

  const fetchProfile = useCallback(async () => {
    if (!userId) { setState({ profile: null, loading: false, error: null }); return }
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_friend_profile', { p_user_id: userId })
      if (error) throw error
      setState({ profile: data as FriendProfile, loading: false, error: null })
      telemetry.track(AnalyticsEvent.FRIEND_PROFILE_VIEWED)
    } catch (err) {
      setState({ profile: null, loading: false, error: String(err) })
    }
  }, [userId])

  useEffect(() => { void fetchProfile() }, [fetchProfile])

  return { ...state, refetch: fetchProfile }
}
