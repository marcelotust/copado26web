import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useInactivityReload } from './useInactivityReload'

describe('useInactivityReload', () => {
  let reloadSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    reloadSpy = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload: reloadSpy },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  function triggerHidden() {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    document.dispatchEvent(new Event('visibilitychange'))
  }

  function triggerVisible() {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    document.dispatchEvent(new Event('visibilitychange'))
  }

  it('does not reload when returning before threshold', () => {
    renderHook(() => useInactivityReload(30 * 60 * 1000))
    triggerHidden()
    vi.advanceTimersByTime(10 * 60 * 1000) // 10 min
    triggerVisible()
    expect(reloadSpy).not.toHaveBeenCalled()
  })

  it('reloads when returning after threshold', () => {
    renderHook(() => useInactivityReload(30 * 60 * 1000))
    triggerHidden()
    vi.advanceTimersByTime(31 * 60 * 1000) // 31 min
    triggerVisible()
    expect(reloadSpy).toHaveBeenCalledOnce()
  })

  it('does not reload on first visibility event (no prior hidden)', () => {
    renderHook(() => useInactivityReload(30 * 60 * 1000))
    triggerVisible()
    expect(reloadSpy).not.toHaveBeenCalled()
  })

  it('reloads on window focus after threshold', () => {
    renderHook(() => useInactivityReload(30 * 60 * 1000))
    triggerHidden()
    vi.advanceTimersByTime(31 * 60 * 1000)
    window.dispatchEvent(new Event('focus'))
    expect(reloadSpy).toHaveBeenCalledOnce()
  })

  it('does not reload after unmount', () => {
    const { unmount } = renderHook(() => useInactivityReload(30 * 60 * 1000))
    triggerHidden()
    vi.advanceTimersByTime(31 * 60 * 1000)
    unmount()
    triggerVisible()
    expect(reloadSpy).not.toHaveBeenCalled()
  })

  it('reloads exactly once when both visibilitychange and focus fire together', () => {
    renderHook(() => useInactivityReload(30 * 60 * 1000))
    triggerHidden()
    vi.advanceTimersByTime(31 * 60 * 1000)
    triggerVisible()
    window.dispatchEvent(new Event('focus'))
    expect(reloadSpy).toHaveBeenCalledOnce()
  })
})
