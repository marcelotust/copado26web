import { describe, expect, it } from 'vitest'
import { extractNickname } from './QRScanner'

describe('extractNickname', () => {
  it('returns the code from a valid /friends/add URL', () => {
    expect(extractNickname('https://meualbum2026.app/friends/add?code=rafa_p')).toBe('rafa_p')
  })

  it('accepts a raw nickname', () => {
    expect(extractNickname('rafa_p')).toBe('rafa_p')
  })

  it('normalizes to lowercase', () => {
    expect(extractNickname('Rafa_P')).toBe('rafa_p')
    expect(extractNickname('https://meualbum2026.app/x?code=FOO')).toBe('foo')
  })

  it('rejects URL codes that do not match the nickname regex', () => {
    expect(extractNickname('https://example.com/x?code=<script>alert(1)</script>')).toBeNull()
    expect(extractNickname('https://example.com/x?code=ab')).toBeNull()
    expect(extractNickname('https://example.com/x?code=' + 'a'.repeat(21))).toBeNull()
    expect(extractNickname('https://example.com/x?code=has space')).toBeNull()
    expect(extractNickname('https://example.com/x?code=' + encodeURIComponent('a/b'))).toBeNull()
  })

  it('rejects raw text that is not a valid nickname', () => {
    expect(extractNickname('rl-pereira')).toBeNull()
    expect(extractNickname('')).toBeNull()
    expect(extractNickname('ab')).toBeNull()
  })
})
