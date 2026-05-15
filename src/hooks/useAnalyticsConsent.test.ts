import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readAnalyticsConsent, useAnalyticsConsent } from './useAnalyticsConsent'

vi.mock('../lib/telemetry', () => ({
  AnalyticsEvent: { CONSENT_ANALYTICS_UPDATED: 'consent_analytics_updated' },
  telemetry: { track: vi.fn() },
}))

describe('useAnalyticsConsent', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('persists grant and reload reads granted', () => {
    const { result } = renderHook(() => useAnalyticsConsent('user-1'))
    act(() => { result.current.grant() })
    expect(result.current.consent).toBe('granted')
    expect(readAnalyticsConsent('user-1')).toBe('granted')
  })

  it('persists decline and reload reads declined', () => {
    const { result } = renderHook(() => useAnalyticsConsent('user-1'))
    act(() => { result.current.decline() })
    expect(result.current.consent).toBe('declined')
    expect(readAnalyticsConsent('user-1')).toBe('declined')
  })
})
