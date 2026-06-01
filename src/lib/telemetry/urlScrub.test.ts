import { describe, expect, it } from 'vitest'
import { scrubPathname, scrubPosthogProperties, scrubUrl } from './urlScrub'

describe('scrubUrl', () => {
  it('redacts the trade payload', () => {
    expect(scrubUrl('https://meualbum2026.app/trade?d=N4Igzg')).toBe(
      'https://meualbum2026.app/trade?d=REDACTED',
    )
  })

  it('redacts the friends ?code= param', () => {
    expect(scrubUrl('https://meualbum2026.app/friends/add?code=rafa_p')).toBe(
      'https://meualbum2026.app/friends/add?code=REDACTED',
    )
  })

  it('replaces the /u/<nickname> path with a placeholder', () => {
    expect(scrubUrl('https://meualbum2026.app/u/rafa_p')).toBe(
      'https://meualbum2026.app/u/:nick',
    )
  })

  it('handles /u/<nickname>?with_query', () => {
    expect(scrubUrl('https://meualbum2026.app/u/rafa_p?from=qr')).toBe(
      'https://meualbum2026.app/u/:nick?from=qr',
    )
  })

  it('redacts Supabase auth tokens in the hash', () => {
    const out = scrubUrl('https://meualbum2026.app/#access_token=abc&refresh_token=xyz&type=magiclink')
    expect(out).toContain('access_token=REDACTED')
    expect(out).toContain('refresh_token=REDACTED')
    expect(out).toContain('type=magiclink')
  })

  it('leaves untouched URLs alone', () => {
    expect(scrubUrl('https://meualbum2026.app/dashboard')).toBe(
      'https://meualbum2026.app/dashboard',
    )
  })

  it('returns non-URL input unchanged', () => {
    expect(scrubUrl('not a url')).toBe('not a url')
    expect(scrubUrl('')).toBe('')
    expect(scrubUrl(null)).toBe('')
  })
})

describe('scrubPathname', () => {
  it('strips ?d= from a pathname-with-query', () => {
    expect(scrubPathname('/trade?d=N4Igzg')).toBe('/trade?d=REDACTED')
  })

  it('replaces /u/<nick>', () => {
    expect(scrubPathname('/u/rafa_p')).toBe('/u/:nick')
  })

  it('passes plain paths through', () => {
    expect(scrubPathname('/dashboard')).toBe('/dashboard')
  })
})

describe('scrubPosthogProperties', () => {
  it('scrubs $current_url and $pathname together', () => {
    const props: Record<string, unknown> = {
      $current_url: 'https://meualbum2026.app/trade?d=N4Igzg',
      $pathname: '/trade?d=N4Igzg',
      $referrer: 'https://meualbum2026.app/u/rafa_p',
      distinct_id: 'safe',
      action: 'view',
    }
    scrubPosthogProperties(props)
    expect(props.$current_url).toBe('https://meualbum2026.app/trade?d=REDACTED')
    expect(props.$pathname).toBe('/trade?d=REDACTED')
    expect(props.$referrer).toBe('https://meualbum2026.app/u/:nick')
    expect(props.distinct_id).toBe('safe')
    expect(props.action).toBe('view')
  })

  it('handles $initial_* counterparts', () => {
    const props: Record<string, unknown> = {
      $initial_current_url: 'https://meualbum2026.app/u/rafa_p',
      $initial_referrer: 'https://meualbum2026.app/trade?d=secret',
      $initial_pathname: '/u/rafa_p',
    }
    scrubPosthogProperties(props)
    expect(props.$initial_current_url).toBe('https://meualbum2026.app/u/:nick')
    expect(props.$initial_referrer).toBe('https://meualbum2026.app/trade?d=REDACTED')
    expect(props.$initial_pathname).toBe('/u/:nick')
  })

  it('leaves non-string URL props alone', () => {
    const props: Record<string, unknown> = { $current_url: 123 as unknown as string }
    scrubPosthogProperties(props)
    expect(props.$current_url).toBe(123)
  })
})
