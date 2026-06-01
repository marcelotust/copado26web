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

  it('keeps benign suffix keys that contain blocked prefixes', () => {
    // re-sweep regression: `team_code`, `error_code`, `cta_id`, `cta_variant`
    // must stay even though `code`/`url`/`token` are blocked as standalone keys.
    expect(
      sanitizeAnalyticsProps({
        team_code: 'BRA',
        error_code: 'rate_limited',
        cta_variant: 'treatment',
      }),
    ).toEqual({ team_code: 'BRA', error_code: 'rate_limited', cta_variant: 'treatment' })
  })

  it('blocks new sensitive prefixes added by the 2026-06 sweep', () => {
    expect(
      sanitizeAnalyticsProps({
        code: 'rafa_p',
        url: 'https://meualbum.app/trade?d=secret',
        token: 'eyJhbGciOi',
        query: 'super secret',
        payload: 'inner data',
        href: 'https://x',
        cpf: '11122233344',
        phone: '+5511999998888',
      }),
    ).toEqual(undefined)
  })
})
