import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ONBOARDING_FADE_MS, useOnboardingStepFade } from './useOnboardingStepFade'

describe('useOnboardingStepFade', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fades out, changes step, then reveals when target is ready', () => {
    const { result } = renderHook(() => useOnboardingStepFade(0))

    act(() => {
      result.current.goToStep(1)
    })
    expect(result.current.visible).toBe(false)
    expect(result.current.stepIndex).toBe(0)

    act(() => {
      vi.advanceTimersByTime(ONBOARDING_FADE_MS)
    })
    expect(result.current.stepIndex).toBe(1)
    expect(result.current.visible).toBe(false)

    act(() => {
      result.current.tryReveal({ top: 0, left: 0, width: 10, height: 10 }, true)
    })
    act(() => {
      vi.advanceTimersByTime(40)
    })
    expect(result.current.visible).toBe(true)
  })

  it('waits for target when needsTarget is true', () => {
    const { result } = renderHook(() => useOnboardingStepFade(0))

    act(() => {
      result.current.goToStep(1)
      vi.advanceTimersByTime(ONBOARDING_FADE_MS)
    })

    act(() => {
      result.current.tryReveal(null, true)
    })
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current.visible).toBe(false)

    act(() => {
      result.current.tryReveal({ top: 1, left: 2, width: 3, height: 4 }, true)
      vi.advanceTimersByTime(40)
    })
    expect(result.current.visible).toBe(true)
  })
})
