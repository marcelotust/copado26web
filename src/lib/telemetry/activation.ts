const FIRST_STICKER_KEY_PREFIX = 'meualbum_first_sticker_v1_'

/** Returns true once per user when the first positive quantity change is tracked. */
export function consumeFirstStickerChange(userId: string): boolean {
  const key = `${FIRST_STICKER_KEY_PREFIX}${userId}`
  try {
    if (localStorage.getItem(key)) return false
    localStorage.setItem(key, '1')
    return true
  } catch {
    return false
  }
}
