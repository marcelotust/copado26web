// src/hooks/useSupabaseProgress.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useSupabaseProgress(userId) {
  const [progress, setProgress] = useState({ total: 0, collected: 0, swaps: 0 })

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function fetchProgress() {
      const { data } = await supabase
        .from('stickers')
        .select('quantity')
        .eq('user_id', userId)

      if (cancelled) return
      if (!data) return
      const total = data.length
      const collected = data.filter(s => s.quantity >= 1).length
      const swaps = data.reduce((acc, s) => acc + Math.max(0, s.quantity - 1), 0)
      setProgress({ total, collected, swaps })
    }

    fetchProgress()

    const channel = supabase
      .channel(`progress-${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'stickers',
        filter: `user_id=eq.${userId}`,
      }, () => fetchProgress())
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [userId])

  return progress
}

export function useSupabaseSectionProgress(userId, teamCode) {
  const [progress, setProgress] = useState({ total: 0, collected: 0 })

  useEffect(() => {
    if (!userId || !teamCode) return
    let cancelled = false

    async function fetchProgress() {
      const { data } = await supabase
        .from('stickers')
        .select('quantity')
        .eq('user_id', userId)
        .eq('team_code', teamCode)

      if (cancelled) return
      if (!data) return
      setProgress({
        total: data.length,
        collected: data.filter(s => s.quantity >= 1).length,
      })
    }

    fetchProgress()

    const channel = supabase
      .channel(`section-progress-${userId}-${teamCode}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'stickers',
        filter: `user_id=eq.${userId}`,
      }, () => fetchProgress())
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [userId, teamCode])

  return progress
}
