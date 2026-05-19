import { test, expect } from '@playwright/test'
import type { Challenge } from '../../src/data/challenges'
import type { MissingGroup, SwapGroup } from '../../src/state/stickersTypes'
import type { Sticker } from '../../src/types/database'
import { buildShareUrl } from '../../src/lib/brand/shareFooter'
import {
  buildChallengeShareText,
  buildMilestoneShareText,
  buildMissingShareText,
  buildSwapsShareText,
} from '../../src/lib/shareText'

/**
 * Single canonical share footer across all four flows (handoff seção 09).
 * The signature is i18n-driven, but the meualbum2026.app marker is
 * preserved in every locale so tradeListParse keeps detecting pastes.
 */
const SIGNATURE_PT =
  'Cola o teu álbum em meualbum2026.app — é grátis,\ne dá pra trocar sobras com a galera direto pelo zap.'
const SIGNATURE_EN =
  "Track your album at meualbum2026.app — it's free,\nand you can swap dupes with friends on WhatsApp."

const I18N: Record<string, string> = {
  'share.missingHeadline': '⚽ Copa 2026 — me faltam {{count}} figurinhas!',
  'share.swapsHeadline': '⚽ Copa 2026 — tenho {{count}} figurinhas repetidas para trocar!',
  'share.signature': SIGNATURE_PT,
  'milestone.albumHeadline': '{{pct}}% do álbum!',
  'milestone.teamHeadline': 'Time completo! 🎉',
  'challenges.shareText': 'Completei o desafio «{{title}}» no Meu Álbum 2026! ⚽',
  'challenges.items.kickoff.title': 'Primeiros Passos',
}
const t = (key: string) => I18N[key] ?? key
const teamName = (code: string) => (code === 'BRA' ? 'Brasil' : code)
const teamFlag = (code: string) => (code === 'BRA' ? '🇧🇷' : '⚪')
const trailer = `\n\n${SIGNATURE_PT}`

test.describe('share footer across the four share flows', () => {
  test('missing share text ends with the canonical signature', () => {
    const groups: MissingGroup[] = [{ teamCode: 'BRA', numbers: [1, 13] }]
    const out = buildMissingShareText(groups, teamName, teamFlag, 2, t)
    expect(out.endsWith(trailer)).toBe(true)
  })

  test('swaps share text ends with the canonical signature', () => {
    const stickers: Sticker[] = [
      { id: 'BRA-03', team_code: 'BRA', number: 3, quantity: 3 } as Sticker,
    ]
    const groups: SwapGroup[] = [{ teamCode: 'BRA', stickers }]
    const out = buildSwapsShareText(groups, teamName, teamFlag, 2, t)
    expect(out.endsWith(trailer)).toBe(true)
  })

  test('challenge share text ends with the canonical signature', () => {
    const challenge = { id: 'kickoff' } as Challenge
    const out = buildChallengeShareText(challenge, t)
    expect(out.endsWith(trailer)).toBe(true)
  })

  test('milestone share text (album) ends with the canonical signature', () => {
    const out = buildMilestoneShareText({ kind: 'album', pct: 50 }, t)
    expect(out.endsWith(trailer)).toBe(true)
  })

  test('milestone share text (team) ends with the canonical signature', () => {
    const out = buildMilestoneShareText(
      { kind: 'team', teamCode: 'BRA', flag: '🇧🇷', name: 'Brasil' },
      t,
    )
    expect(out.endsWith(trailer)).toBe(true)
  })

  test('signature swaps with locale when t() returns a different string', () => {
    const tEn = (key: string) => (key === 'share.signature' ? SIGNATURE_EN : I18N[key] ?? key)
    const out = buildMilestoneShareText({ kind: 'album', pct: 100 }, tEn)
    expect(out.endsWith(`\n\n${SIGNATURE_EN}`)).toBe(true)
  })

  test('text shares use the bare brand URL — no UTM params leak into pasted text', () => {
    expect(buildShareUrl({ flow: 'missing', medium: 'text' })).toBe('https://meualbum2026.app')
  })

  test('image shares (QR target) carry per-flow UTM tracking', () => {
    expect(buildShareUrl({ flow: 'milestone', medium: 'image' })).toContain(
      'utm_source=share_card',
    )
    expect(buildShareUrl({ flow: 'milestone', medium: 'image' })).toContain(
      'utm_campaign=milestone',
    )
    expect(buildShareUrl({ flow: 'swaps', medium: 'image' })).toContain('utm_campaign=swaps')
  })

  test('every locale signature preserves the meualbum2026.app marker for tradeListParse', () => {
    expect(/meualbum2026?\.app/i.test(SIGNATURE_PT)).toBe(true)
    expect(/meualbum2026?\.app/i.test(SIGNATURE_EN)).toBe(true)
  })
})
