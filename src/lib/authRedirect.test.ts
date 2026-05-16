import { beforeEach, describe, expect, it } from 'vitest'
import {
  AUTH_CALLBACK_PENDING_KEY,
  DEFAULT_POST_LOGIN_PATH,
  clearAuthCallbackPending,
  consumePostLoginPath,
  hasPendingAuthCallback,
  isSupabaseAuthCallback,
  markAuthCallbackPending,
} from './authRedirect'

describe('authRedirect', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('detects Supabase auth callbacks in query strings and hashes', () => {
    expect(isSupabaseAuthCallback('?code=abc', '')).toBe(true)
    expect(isSupabaseAuthCallback('?token_hash=abc&type=magiclink', '')).toBe(true)
    expect(isSupabaseAuthCallback('', '#access_token=abc&refresh_token=def')).toBe(true)
    expect(isSupabaseAuthCallback('', '#error_code=otp_expired')).toBe(true)
    expect(isSupabaseAuthCallback('?utm_source=email', '')).toBe(false)
  })

  it('tracks a pending auth callback while Supabase cleans the URL', () => {
    expect(hasPendingAuthCallback()).toBe(false)
    markAuthCallbackPending()
    expect(sessionStorage.getItem(AUTH_CALLBACK_PENDING_KEY)).toBe('1')
    expect(hasPendingAuthCallback()).toBe(true)
    clearAuthCallbackPending()
    expect(hasPendingAuthCallback()).toBe(false)
  })

  it('consumes safe post-login paths and falls back to dashboard otherwise', () => {
    sessionStorage.setItem('post_login', '/album?section=ARG')
    expect(consumePostLoginPath('post_login')).toBe('/album?section=ARG')
    expect(sessionStorage.getItem('post_login')).toBeNull()

    sessionStorage.setItem('post_login', 'https://example.com')
    expect(consumePostLoginPath('post_login')).toBe(DEFAULT_POST_LOGIN_PATH)

    sessionStorage.setItem('post_login', '//example.com')
    expect(consumePostLoginPath('post_login')).toBe(DEFAULT_POST_LOGIN_PATH)
  })
})
