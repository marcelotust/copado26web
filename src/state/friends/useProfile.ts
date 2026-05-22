import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Profile } from './types'

type ProfileState = { profile: Profile | null; loading: boolean; error: string | null }

export function useProfile(userId: string) {
  const [state, setState] = useState<ProfileState>({ profile: null, loading: true, error: null })

  const fetchProfile = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_my_profile')
      if (error) throw error
      setState({ profile: data as Profile | null, loading: false, error: null })
    } catch (err) {
      setState({ profile: null, loading: false, error: String(err) })
    }
  }, [])

  useEffect(() => {
    void fetchProfile()
  }, [fetchProfile, userId])

  async function setNickname(nickname: string, displayName?: string): Promise<{ ok: boolean; is_new?: boolean; error?: string }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('set_nickname', {
        p_nickname: nickname,
        p_display_name: displayName ?? null,
      })
      if (error) throw error
      await fetchProfile()
      return { ok: true, is_new: (data as { is_new?: boolean } | null)?.is_new }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? String(err)
      return { ok: false, error: msg }
    }
  }

  async function updateDisplayName(displayName: string): Promise<{ ok: boolean; error?: string }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.rpc as any)('update_display_name', { p_display_name: displayName })
      if (error) throw error
      await fetchProfile()
      return { ok: true }
    } catch (err: unknown) {
      return { ok: false, error: (err as { message?: string })?.message ?? String(err) }
    }
  }

  async function updateVisibility(visibility: string): Promise<{ ok: boolean; error?: string }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.rpc as any)('update_profile_visibility', { p_visibility: visibility })
      if (error) throw error
      setState(s => s.profile ? { ...s, profile: { ...s.profile, collection_visibility: visibility as Profile['collection_visibility'] } } : s)
      return { ok: true }
    } catch (err: unknown) {
      return { ok: false, error: (err as { message?: string })?.message ?? String(err) }
    }
  }

  return { ...state, refetch: fetchProfile, setNickname, updateDisplayName, updateVisibility }
}
