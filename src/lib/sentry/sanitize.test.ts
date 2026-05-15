import { describe, expect, it } from 'vitest'
import { scrubRecord, sentryBeforeSend } from './sanitize'

describe('sentry sanitize', () => {
  it('redacts sensitive keys', () => {
    expect(scrubRecord({ team_code: 'BRA', email: 'a@b.com', access_token: 'secret' })).toEqual({
      team_code: 'BRA',
      email: '[redacted]',
      access_token: '[redacted]',
    })
  })

  it('strips PII from user and extra on beforeSend', () => {
    const event = sentryBeforeSend({
      user: { id: 'u1', email: 'user@example.com' },
      extra: { sticker_id: 'x', authorization: 'Bearer abc' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    expect(event?.user).toEqual({ id: 'u1' })
    expect(event?.extra).toEqual({ sticker_id: 'x', authorization: '[redacted]' })
  })
})
