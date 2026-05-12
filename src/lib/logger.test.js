import { afterEach, describe, expect, it, vi } from 'vitest'
import { configureLogger, createLogger, resetLoggerForTests } from './logger'

describe('createLogger', () => {
  afterEach(() => {
    resetLoggerForTests()
    vi.restoreAllMocks()
  })

  it('drops sensitive keys from structured context', () => {
    const sink = vi.fn()
    configureLogger({ sink })

    const log = createLogger('auth')
    log.error('magic_link_failed', { email: 'user@example.com', error_code: 'otp_rate_limit' })

    expect(sink).toHaveBeenCalledOnce()
    const [, entry] = sink.mock.calls[0]
    expect(entry).toMatchObject({
      feature: 'auth',
      action: 'magic_link_failed',
      error_code: 'otp_rate_limit',
    })
    expect(entry).not.toHaveProperty('email')
  })
})
