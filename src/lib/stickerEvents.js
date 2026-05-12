/** Minimal pub/sub so sticker mutations immediately notify progress hooks. */

/** @type {Set<() => void>} */
const listeners = new Set()

/** Subscribe to sticker change events. Returns an unsubscribe function. */
export function onStickerChanged(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Emit from useStickerActions whenever a quantity changes. */
export function emitStickerChanged() {
  listeners.forEach(fn => fn())
}
