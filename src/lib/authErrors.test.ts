import { describe, expect, it } from 'vitest'
import { authErrorMessageKey } from './authErrors'

describe('authErrorMessageKey', () => {
  it('maps rate limit codes', () => {
    expect(authErrorMessageKey({ code: 'over_email_send_rate_limit' })).toBe('errors.authRateLimit')
  })

  it('falls back to generic', () => {
    expect(authErrorMessageKey({ code: 'unexpected', message: 'secret' })).toBe('errors.authGeneric')
  })
})
