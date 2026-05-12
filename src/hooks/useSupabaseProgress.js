// src/hooks/useSupabaseProgress.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { SECTIONS } from '../db/seed'
import { onStickerChanged } from '../lib/stickerEvents'

const ALBUM_TOTAL = SECTIONS.reduce((acc, s) => acc + s.count, 0)

/** @param {string|undefined} userId */
export function useSupabaseProgress(userId) {
  const [progress, setProgress] = useState({ total: ALBUM_TOTAL, collected: 0, swaps: 0 })

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    let seq = 0

    async function fetchProgress() {
      const mySeq = ++seq
      const { data } = await supabase
        .from('stickers')
        .select('quantity')
        .eq('user_id', userId)

      if (cancelled || mySeq !== seq) return
      if (!data) return
      const collected = data.filter(s => s.quantity >= 1).length
      const swaps = data.reduce((acc, s) => acc + Math.max(0, s.quantity - 1), 0)
      setProgress({ total: ALBUM_TOTAL, collected, swaps })
    }

    fetchProgress()

    const unsubscribe = onStickerChanged(fetchProgress)

    const channel = supabase
      .channel(`progress-${userId}-${Date.now()}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'stickers',
        filter: `user_id=eq.${userId}`,
      }, () => fetchProgress())
      .subscribe()

    return () => {
      cancelled = true
      unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [userId])

  return progress
}

/** @param {string|undefined} userId @param {string|undefined} teamCode */
export function useSupabaseSectionProgress(userId, teamCode) {
  const sectionTotal = SECTIONS.find(s => s.code === teamCode)?.count ?? 0
  const [progress, setProgress] = useState({ total: sectionTotal, collected: 0 })

  useEffect(() => {
    if (!userId || !teamCode) return
    let cancelled = false
    let seq = 0

    async function fetchProgress() {
      const mySeq = ++seq
      const { data } = await supabase
        .from('stickers')
        .select('quantity')
        .eq('user_id', userId)
        .eq('team_code', teamCode)

      if (cancelled || mySeq !== seq) return
      if (!data) return
      setProgress({
        total: sectionTotal,
        collected: data.filter(s => s.quantity >= 1).length,
      })
    }

    fetchProgress()

    const unsubscribe = onStickerChanged(fetchProgress)

    const channel = supabase
      .channel(`section-progress-${userId}-${teamCode}-${Date.now()}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'stickers',
        filter: `user_id=eq.${userId}`,
      }, () => fetchProgress())
      .subscribe()

    return () => {
      cancelled = true
      unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [userId, teamCode])

  return progress
}
