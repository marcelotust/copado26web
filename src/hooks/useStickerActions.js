import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function useStickerActions(sticker, userId) {
  const [popping, setPopping] = useState(false)
  const [floats, setFloats] = useState([])

  async function handleAdd(/** @type {React.MouseEvent} */ e) {
    e.stopPropagation()
    setPopping(true)
    setFloats(f => [...f, Date.now()])
    setTimeout(() => setPopping(false), 200)
    setTimeout(() => setFloats(f => f.slice(1)), 750)

    const { data: row, error: fetchError } = await supabase
      .from('stickers')
      .select('quantity')
      .eq('id', sticker.id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !row) {
      console.error('Failed to fetch sticker for increment:', fetchError)
      return
    }

    const { error } = await supabase
      .from('stickers')
      .update({ quantity: row.quantity + 1 })
      .eq('id', sticker.id)
      .eq('user_id', userId)

    if (error) console.error('Failed to increment sticker:', error)
  }

  async function handleRemove(/** @type {React.MouseEvent} */ e) {
    e.stopPropagation()

    const { data: row, error: fetchError } = await supabase
      .from('stickers')
      .select('quantity')
      .eq('id', sticker.id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !row || row.quantity <= 0) return

    const { error } = await supabase
      .from('stickers')
      .update({ quantity: row.quantity - 1 })
      .eq('id', sticker.id)
      .eq('user_id', userId)

    if (error) console.error('Failed to decrement sticker:', error)
  }

  return { popping, floats, handleAdd, handleRemove }
}
