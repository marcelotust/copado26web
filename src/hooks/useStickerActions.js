import { useState, useRef, useEffect } from 'react'
import { useAdjustSticker } from '../state/stickersStore'

// Click handlers + animations for a single sticker card.
// Quantity itself lives in the central StickersProvider; this hook only owns
// the local animation state and the debounced flush of accumulated deltas.

export function useStickerActions(sticker) {
  const adjust = useAdjustSticker()

  const [popping, setPopping] = useState(false)
  const [floats, setFloats]   = useState(/** @type {number[]} */ ([]))
  const [removals, setRemovals] = useState(/** @type {number[]} */ ([]))
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

  // Pending delta accumulated since the last flush — keeps rapid clicks
  // collapsed into a single RPC call.
  const pendingDeltaRef = useRef(0)
  const timerRef = useRef(/** @type {ReturnType<typeof setTimeout>|null} */ (null))

  function flush() {
    const delta = pendingDeltaRef.current
    pendingDeltaRef.current = 0
    timerRef.current = null
    if (delta === 0) return
    adjust(sticker.id, delta).catch(err => {
      console.error('Failed to adjust sticker:', err)
    })
  }

  function schedule() {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(flush, 400)
  }

  // Flush any pending write on unmount so rapid clicks at navigation aren't lost
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      if (pendingDeltaRef.current !== 0) {
        const delta = pendingDeltaRef.current
        pendingDeltaRef.current = 0
        adjust(sticker.id, delta).catch(err => {
          console.error('Failed to adjust sticker on unmount:', err)
        })
      }
    }
  // sticker.id and adjust are stable enough; intentional minimal deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleAdd(/** @type {React.MouseEvent} */ e) {
    e.stopPropagation()
    setPopping(true)
    setFloats(f => [...f, Date.now()])
    setTimeout(() => setPopping(false), 200)
    setTimeout(() => setFloats(f => f.slice(1)), 750)
    pendingDeltaRef.current += 1
    schedule()
  }

  function handleRemove(/** @type {React.MouseEvent} */ e) {
    e.stopPropagation()
    if (sticker.quantity <= 0) return
    if (sticker.quantity === 1) {
      setShowRemoveConfirm(true)
      return
    }
    doRemove()
  }

  function doRemove() {
    setRemovals(f => [...f, Date.now()])
    setTimeout(() => setRemovals(f => f.slice(1)), 750)
    pendingDeltaRef.current -= 1
    schedule()
  }

  function handleConfirmRemove() {
    setShowRemoveConfirm(false)
    doRemove()
  }

  function handleCancelRemove() {
    setShowRemoveConfirm(false)
  }

  return {
    qty: sticker.quantity,
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
