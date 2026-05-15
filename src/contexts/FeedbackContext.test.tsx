import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { I18nProvider } from '../i18n'
import { FeedbackProvider, useFeedback } from './FeedbackContext'

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <FeedbackProvider>{children}</FeedbackProvider>
    </I18nProvider>
  )
}

describe('useFeedback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('queues a success toast message key', () => {
    const { result } = renderHook(() => useFeedback(), { wrapper })
    act(() => {
      result.current.success('feedback.exportSuccess')
    })
    expect(document.querySelector('[role="status"]')).toBeTruthy()
  })

  it('auto-dismisses after duration', () => {
    const { result } = renderHook(() => useFeedback(), { wrapper })
    act(() => {
      result.current.error('feedback.exportFailed')
    })
    expect(document.querySelector('[role="alert"]')).toBeTruthy()
    act(() => {
      vi.advanceTimersByTime(7000)
    })
    expect(document.querySelector('[role="alert"]')).toBeNull()
  })
})
