import { useState, useCallback, useContext, type MouseEvent } from 'react'
import { useAdjustSticker, useStickersContext } from '../state/stickersStore'
import { useDebouncedFlush } from './useDebouncedFlush'
import type { Sticker } from '../types/database'
import { consumeFirstStickerChange } from '../lib/telemetry/activation'
import { reportError } from '../lib/logger'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'
import { readOnboardingStickerContext } from '../components/onboarding/storage'
import { PaywallContext } from '../contexts/PaywallContext'

// Click handlers + animations for a single sticker card. Quantity itself
// lives in the central StickersProvider; this hook only owns the local
// animation state and routes accumulated deltas through a debounced flush.

export function useStickerActions(sticker: Pick<Sticker, 'id' | 'quantity' | 'team_code'>) {
  const { userId } = useStickersContext()
  const adjust = useAdjustSticker()
  const triggerPaywall = useContext(PaywallContext)

  const [popping, setPopping]   = useState(false)
  const [floats, setFloats]     = useState<number[]>([])
  const [removals, setRemovals] = useState<number[]>([])
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

  const flushDelta = useCallback((delta: number) => {
    adjust(sticker.id, delta).catch((err) => {
      reportError('adjust sticker rejected', err, { feature: 'stickers', action: 'adjust_ui' }, { sticker_id: sticker.id })
    })
  }, [adjust, sticker.id])
  const { bump } = useDebouncedFlush(flushDelta)

  function handleAdd(e: MouseEvent) {
    e.stopPropagation()
    if (triggerPaywall) { triggerPaywall('sticker_toggle'); return }
    setPopping(true)
    setFloats(f => [...f, Date.now()])
    setTimeout(() => setPopping(false), 200)
    setTimeout(() => setFloats(f => f.slice(1)), 750)
    bump(+1)
    const isFirst = consumeFirstStickerChange(userId)
    telemetry.track(AnalyticsEvent.STICKER_QUANTITY_CHANGED, {
      team_code: sticker.team_code,
      delta: 1,
      source: 'ui_click',
      ...(isFirst ? { is_first_sticker_change: true } : {}),
      ...readOnboardingStickerContext(),
    })
  }

  function doRemove() {
    setRemovals(f => [...f, Date.now()])
    setTimeout(() => setRemovals(f => f.slice(1)), 750)
    bump(-1)
    telemetry.track(AnalyticsEvent.STICKER_QUANTITY_CHANGED, {
      team_code: sticker.team_code,
      delta: -1,
      source: 'ui_click',
    })
  }

  function handleRemove(e: MouseEvent) {
    e.stopPropagation()
    if (triggerPaywall) { triggerPaywall('sticker_toggle'); return }
    if (sticker.quantity <= 0) return
    if (sticker.quantity === 1) { setShowRemoveConfirm(true); return }
    doRemove()
  }

  function handleConfirmRemove() { setShowRemoveConfirm(false); doRemove() }
  function handleCancelRemove()  { setShowRemoveConfirm(false) }

  return {
    qty: sticker.quantity,
    popping, floats, removals, showRemoveConfirm,
    handleAdd, handleRemove, handleConfirmRemove, handleCancelRemove,
  }
}
