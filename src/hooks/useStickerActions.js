import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { emitStickerChanged } from '../lib/stickerEvents'

export function useStickerActions(sticker, userId, onPatch) {
  const [popping, setPopping] = useState(false)
  const [floats, setFloats] = useState(/** @type {number[]} */ ([]))
  const [removals, setRemovals] = useState(/** @type {number[]} */ ([]))
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  // Drives the card display — insulated from stale server re-fetches during pending writes
  const [optimisticQty, setOptimisticQty] = useState(sticker.quantity)

  // Tracks optimistic quantity synchronously — bypasses React batching for rapid clicks
  const localQtyRef = useRef(sticker.quantity)
  const pendingWriteRef = useRef(false)
  const timerRef = useRef(/** @type {ReturnType<typeof setTimeout>|null} */ (null))

  // Accept server quantity only when no local write is pending
  useEffect(() => {
    if (!pendingWriteRef.current) {
      localQtyRef.current = sticker.quantity
      setOptimisticQty(sticker.quantity)
    }
  }, [sticker.quantity])

  function flush() {
    const qty = localQtyRef.current
    const id = sticker.id
    timerRef.current = null
    supabase
      .from('stickers')
      .update({ quantity: qty })
      .eq('id', id)
      .eq('user_id', userId)
      .then(({ error }) => {
        pendingWriteRef.current = false
        if (error) console.error('Failed to update sticker:', error)
      })
  }

  function scheduleFlush() {
    pendingWriteRef.current = true
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(flush, 400)
  }

  // Flush any pending write on unmount so clicks are never lost
  useEffect(() => {
    return () => {
      if (timerRef.current && pendingWriteRef.current) {
        clearTimeout(timerRef.current)
        flush()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleAdd(/** @type {React.MouseEvent} */ e) {
    e.stopPropagation()
    setPopping(true)
    setFloats(f => [...f, Date.now()])
    setTimeout(() => setPopping(false), 200)
    setTimeout(() => setFloats(f => f.slice(1)), 750)

    localQtyRef.current += 1
    setOptimisticQty(localQtyRef.current)
    onPatch?.(sticker.id, { quantity: localQtyRef.current })
    emitStickerChanged()
    scheduleFlush()
  }

  function handleRemove(/** @type {React.MouseEvent} */ e) {
    e.stopPropagation()
    if (localQtyRef.current <= 0) return

    if (localQtyRef.current === 1) {
      setShowRemoveConfirm(true)
      return
    }

    doRemove()
  }

  function doRemove() {
    setRemovals(f => [...f, Date.now()])
    setTimeout(() => setRemovals(f => f.slice(1)), 750)

    localQtyRef.current -= 1
    setOptimisticQty(localQtyRef.current)
    onPatch?.(sticker.id, { quantity: localQtyRef.current })
    emitStickerChanged()
    scheduleFlush()
  }

  function handleConfirmRemove() {
    setShowRemoveConfirm(false)
    doRemove()
  }

  function handleCancelRemove() {
    setShowRemoveConfirm(false)
  }

  return {
    qty: optimisticQty,
    popping,
    floats,
    removals,
    showRemoveConfirm,
    handleAdd,
    handleRemove,
    handleConfirmRemove,
    handleCancelRemove,
  }
}
