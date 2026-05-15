import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

const { auth } = vi.hoisted(() => ({
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithOtp: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
  },
}))

vi.mock('../lib/supabase', () => ({
  supabase: { auth },
}))

import { useAuth } from './useAuth'

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    auth.getSession.mockResolvedValue({ data: { session: null } })
    auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('maps magic link errors to i18n keys', async () => {
    auth.signInWithOtp.mockResolvedValue({
      error: { message: 'rate', code: 'over_email_send_rate_limit' },
    })
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.sendMagicLink('a@b.com')
    })
    await waitFor(() => {
      expect(result.current.errorKey).toBe('errors.authRateLimit')
    })
  })
})
