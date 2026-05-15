import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { I18nProvider } from '../i18n'
import { FeedbackProvider } from '../contexts/FeedbackContext'

const mockFeedback = { show: vi.fn(), success: vi.fn(), error: vi.fn(), info: vi.fn(), dismiss: vi.fn() }
const adjust = vi.fn()

vi.mock('../contexts/FeedbackContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../contexts/FeedbackContext')>()
  return { ...actual, useFeedback: () => mockFeedback }
})

vi.mock('../state/stickersStore', () => ({
  useStickersContext: () => ({ userId: 'u1' }),
  useAdjustSticker: () => adjust,
}))

vi.mock('../hooks/useDebouncedFlush', () => ({
  useDebouncedFlush: (flush: (d: number) => void) => ({
    bump: (delta: number) => flush(delta),
  }),
}))

vi.mock('../lib/telemetry/activation', () => ({ consumeFirstStickerChange: () => false }))
vi.mock('../components/onboarding/storage', () => ({ readOnboardingStickerContext: () => ({}) }))
vi.mock('../lib/telemetry', () => ({
  AnalyticsEvent: { STICKER_QUANTITY_CHANGED: 'x', STICKER_UPDATE_FAILED: 'y' },
  telemetry: { track: vi.fn() },
}))
vi.mock('../lib/logger', () => ({ reportError: vi.fn() }))

import { useStickerActions } from './useStickerActions'

const sticker = { id: 's1', quantity: 2, team_code: 'BRA' }

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <FeedbackProvider>{children}</FeedbackProvider>
    </I18nProvider>
  )
}

describe('useStickerActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    adjust.mockRejectedValue(new Error('network'))
  })

  it('surfaces feedback when adjust fails', async () => {
    const { result } = renderHook(() => useStickerActions(sticker), { wrapper })
    await act(async () => {
      result.current.handleAdd({ stopPropagation: () => {} } as React.MouseEvent)
    })
    await vi.waitFor(() => {
      expect(mockFeedback.error).toHaveBeenCalledWith('feedback.stickerUpdateFailed')
    })
  })
})
