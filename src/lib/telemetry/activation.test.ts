import { beforeEach, describe, expect, it } from 'vitest'
import { consumeFirstStickerChange } from './activation'

describe('consumeFirstStickerChange', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns true only on the first call per user', () => {
    expect(consumeFirstStickerChange('user-a')).toBe(true)
    expect(consumeFirstStickerChange('user-a')).toBe(false)
    expect(consumeFirstStickerChange('user-b')).toBe(true)
  })
})
