// src/hooks/useSupabaseStickers.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useSupabaseStickers(userId, teamCode) {
  const [stickers, setStickers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || !teamCode) return
    let cancelled = false

    supabase
      .from('stickers')
      .select('*')
      .eq('user_id', userId)
      .eq('team_code', teamCode)
      .order('number', { ascending: true })
      .then(({ data }) => {
        if (!cancelled) {
          setStickers(data ?? [])
          setLoading(false)
        }
      })

    const channel = supabase
      .channel(`stickers-${userId}-${teamCode}-${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stickers',
        filter: `user_id=eq.${userId}`,
      }, payload => {
        setStickers(prev => prev.map(s =>
          s.id === payload.new.id ? { ...s, ...payload.new } : s
        ))
      })
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [userId, teamCode])

  return { stickers, loading }
}
