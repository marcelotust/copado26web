// src/hooks/useSupabaseSwaps.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useSupabaseSwaps(userId) {
  const [swapsByTeam, setSwapsByTeam] = useState([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!userId) return

    async function fetchSwaps() {
      const { data } = await supabase
        .from('stickers')
        .select('*')
        .eq('user_id', userId)
        .gt('quantity', 1)
        .order('team_code', { ascending: true })
        .order('number', { ascending: true })

      if (!data) return

      setTotal(data.reduce((acc, s) => acc + s.quantity - 1, 0))

      const grouped = {}
      for (const sticker of data) {
        if (!grouped[sticker.team_code]) grouped[sticker.team_code] = []
        grouped[sticker.team_code].push(sticker)
      }
      setSwapsByTeam(Object.entries(grouped).map(([teamCode, stickers]) => ({ teamCode, stickers })))
    }

    fetchSwaps()

    const channel = supabase
      .channel(`swaps-${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'stickers',
        filter: `user_id=eq.${userId}`,
      }, () => fetchSwaps())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId])

  return { swapsByTeam, total }
}
