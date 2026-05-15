import { describe, expect, it } from 'vitest'
import { sanitizeAnalyticsProps } from './events'

describe('sanitizeAnalyticsProps', () => {
  it('drops keys that may carry PII', () => {
    expect(
      sanitizeAnalyticsProps({
        team_code: 'BRA',
        email: 'secret@example.com',
        player_name: 'Neymar',
      }),
    ).toEqual({ team_code: 'BRA' })
  })

  it('keeps scalar analytics fields', () => {
    expect(
      sanitizeAnalyticsProps({ delta: 1, source: 'ui_click', granted: true }),
    ).toEqual({ delta: 1, source: 'ui_click', granted: true })
  })
})
