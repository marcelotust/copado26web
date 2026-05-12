// src/hooks/useSupabaseStickers.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/** @typedef {{ id: string, team_code: string, number: number, quantity: number, label?: string|null }} Sticker */

/** @param {string|undefined} userId @param {string|undefined} teamCode */
export function useSupabaseStickers(userId, teamCode) {
  /** @type {[Sticker[], React.Dispatch<React.SetStateAction<Sticker[]>>]} */
  const [stickers, setStickers] = useState(/** @type {Sticker[]} */ ([]))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || !teamCode) return
    let cancelled = false

    async function fetchStickers() {
      const { data } = await supabase
        .from('stickers')
        .select('*')
        .eq('user_id', userId)
        .eq('team_code', teamCode)
        .order('number', { ascending: true })
      if (!cancelled) {
        setStickers(data ?? [])
        setLoading(false)
      }
    }

    fetchStickers()

    const channel = supabase
      .channel(`stickers-${userId}-${teamCode}-${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stickers',
        filter: `user_id=eq.${userId}`,
      }, () => fetchStickers())
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [userId, teamCode])

  /** @param {string} id @param {Partial<Sticker>} changes */
  function patchSticker(id, changes) {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, ...changes } : s))
  }

  return { stickers, loading, patchSticker }
}
