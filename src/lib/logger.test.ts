import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errorCodeFrom, logger } from './logger'

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('errorCodeFrom reads supabase-style code', () => {
    expect(errorCodeFrom({ code: 'PGRST116' })).toBe('PGRST116')
  })

  it('redacts sensitive keys in log payload', () => {
    logger.info('test', {
      feature: 'auth',
      action: 'login',
      email: 'secret@example.com',
    } as Parameters<typeof logger.info>[1] & { email: string })

    const payload = vi.mocked(console.info).mock.calls[0][1] as Record<string, unknown>
    expect(payload.feature).toBe('auth')
    expect(payload.email).toBe('[redacted]')
  })
})
