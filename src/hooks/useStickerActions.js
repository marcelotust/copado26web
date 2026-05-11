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

    await supabase
      .from('stickers')
      .update({ quantity: sticker.quantity + 1 })
      .eq('id', sticker.id)
      .eq('user_id', userId)
  }

  async function handleRemove(/** @type {React.MouseEvent} */ e) {
    e.stopPropagation()
    if (sticker.quantity <= 0) return
    await supabase
      .from('stickers')
      .update({ quantity: sticker.quantity - 1 })
      .eq('id', sticker.id)
      .eq('user_id', userId)
  }

  return { popping, floats, handleAdd, handleRemove }
}
