import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useDataSharingConsent } from './useDataSharingConsent'

describe('useDataSharingConsent', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('seen is false initially', () => {
    const { result } = renderHook(() => useDataSharingConsent('user-1'))
    expect(result.current.seen).toBe(false)
  })

  it('markSeen sets seen to true', () => {
    const { result } = renderHook(() => useDataSharingConsent('user-1'))
    act(() => { result.current.markSeen() })
    expect(result.current.seen).toBe(true)
  })

  it('persists across hook remounts', () => {
    const { result: r1 } = renderHook(() => useDataSharingConsent('user-1'))
    act(() => { r1.current.markSeen() })
    const { result: r2 } = renderHook(() => useDataSharingConsent('user-1'))
    expect(r2.current.seen).toBe(true)
  })

  it('is scoped per userId', () => {
    const { result: r1 } = renderHook(() => useDataSharingConsent('user-1'))
    act(() => { r1.current.markSeen() })
    const { result: r2 } = renderHook(() => useDataSharingConsent('user-2'))
    expect(r2.current.seen).toBe(false)
  })
})
