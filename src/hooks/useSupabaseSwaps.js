// src/hooks/useSupabaseSwaps.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/** @typedef {{ id: string, team_code: string, number: number, quantity: number, label?: string|null }} Sticker */
/** @typedef {{ teamCode: string, stickers: Sticker[] }} SwapGroup */

/** @param {string|undefined} userId */
export function useSupabaseSwaps(userId) {
  /** @type {[SwapGroup[], React.Dispatch<React.SetStateAction<SwapGroup[]>>]} */
  const [swapsByTeam, setSwapsByTeam] = useState(/** @type {SwapGroup[]} */ ([]))

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function fetchSwaps() {
      const { data } = await supabase
        .from('stickers')
        .select('*')
        .eq('user_id', userId)
        .gt('quantity', 1)
        .order('team_code', { ascending: true })
        .order('number', { ascending: true })

      if (cancelled) return
      if (!data) return

      /** @type {Record<string, Sticker[]>} */
      const grouped = {}
      for (const sticker of data) {
        if (!grouped[sticker.team_code]) grouped[sticker.team_code] = []
        grouped[sticker.team_code].push(sticker)
      }
      setSwapsByTeam(Object.entries(grouped).map(([teamCode, stickers]) => ({ teamCode, stickers })))
    }

    fetchSwaps()

    const channel = supabase
      .channel(`swaps-${userId}-${Date.now()}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'stickers',
        filter: `user_id=eq.${userId}`,
      }, () => fetchSwaps())
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [userId])

  /** @param {string} id @param {Partial<Sticker>} changes */
  function patchSticker(id, changes) {
    setSwapsByTeam(prev => {
      const updated = prev.map(group => ({
        ...group,
        stickers: group.stickers.map(s => s.id === id ? { ...s, ...changes } : s),
      }))
      return updated
        .map(group => ({ ...group, stickers: group.stickers.filter(s => s.quantity > 1) }))
        .filter(group => group.stickers.length > 0)
    })
  }

  // Derive total from local state so it stays in sync with every patch
  const total = swapsByTeam.reduce(
    (acc, { stickers }) => acc + stickers.reduce((a, s) => a + s.quantity - 1, 0),
    0
  )

  return { swapsByTeam, total, patchSticker }
}
