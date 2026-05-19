import { describe, expect, it } from 'vitest'
import type { Challenge } from '../data/challenges'
import type { MissingGroup, SwapGroup } from '../state/stickersTypes'
import type { Sticker } from '../types/database'
import {
  buildChallengeShareText,
  buildMilestoneShareText,
  buildMissingShareText,
  buildShareText,
  buildSwapsShareText,
} from './shareText'

const I18N_PT: Record<string, string> = {
  'share.missingHeadline': '⚽ Copa 2026 — me faltam {{count}} figurinhas!',
  'share.swapsHeadline': '⚽ Copa 2026 — tenho {{count}} figurinhas repetidas para trocar!',
  'share.signature':
    'Cola o teu álbum em meualbum2026.app — é grátis,\ne dá pra trocar sobras com a galera direto pelo zap.',
  'milestone.albumHeadline': '{{pct}}% do álbum!',
  'milestone.teamHeadline': 'Time completo! 🎉',
  'challenges.shareText': 'Completei o desafio «{{title}}» no Meu Álbum 2026! ⚽',
  'challenges.items.kickoff.title': 'Primeiros Passos',
}
const I18N_EN: Record<string, string> = {
  ...I18N_PT,
  'share.signature':
    "Track your album at meualbum2026.app — it's free,\nand you can swap dupes with friends on WhatsApp.",
}
const t = (dict: Record<string, string>) => (key: string) => dict[key] ?? key
const teamName = (code: string) => (code === 'BRA' ? 'Brasil' : code)
const teamFlag = (code: string) => (code === 'BRA' ? '🇧🇷' : '⚪')

describe('share.signature i18n contract', () => {
  it('appends to every text body via buildShareText', () => {
    const out = buildShareText('oi', t(I18N_PT))
    expect(out).toBe(`oi\n\n${I18N_PT['share.signature']}`)
  })

  it('preserves the meualbum2026.app marker in every locale', () => {
    expect(/meualbum2026?\.app/i.test(I18N_PT['share.signature']!)).toBe(true)
    expect(/meualbum2026?\.app/i.test(I18N_EN['share.signature']!)).toBe(true)
  })
})

describe('text share builders end with share.signature', () => {
  it('missing share', () => {
    const groups: MissingGroup[] = [{ teamCode: 'BRA', numbers: [1, 13] }]
    const out = buildMissingShareText(groups, teamName, teamFlag, 2, t(I18N_PT))
    expect(out.endsWith(`\n\n${I18N_PT['share.signature']}`)).toBe(true)
    expect(out).toContain('BRA 01')
  })

  it('swaps share', () => {
    const stickers: Sticker[] = [
      { id: 'BRA-03', team_code: 'BRA', number: 3, quantity: 3 } as Sticker,
    ]
    const groups: SwapGroup[] = [{ teamCode: 'BRA', stickers }]
    const out = buildSwapsShareText(groups, teamName, teamFlag, 2, t(I18N_PT))
    expect(out.endsWith(`\n\n${I18N_PT['share.signature']}`)).toBe(true)
    expect(out).toContain('BRA 03 ×2')
  })

  it('challenge share', () => {
    const challenge = { id: 'kickoff' } as Challenge
    const out = buildChallengeShareText(challenge, t(I18N_PT))
    expect(out.endsWith(`\n\n${I18N_PT['share.signature']}`)).toBe(true)
    expect(out).toContain('Primeiros Passos')
  })

  it('milestone share — album', () => {
    const out = buildMilestoneShareText({ kind: 'album', pct: 50 }, t(I18N_PT))
    expect(out.endsWith(`\n\n${I18N_PT['share.signature']}`)).toBe(true)
    expect(out).toContain('50% do álbum!')
  })

  it('milestone share — team', () => {
    const out = buildMilestoneShareText(
      { kind: 'team', teamCode: 'BRA', flag: '🇧🇷', name: 'Brasil' },
      t(I18N_PT),
    )
    expect(out.endsWith(`\n\n${I18N_PT['share.signature']}`)).toBe(true)
    expect(out).toContain('🇧🇷 Brasil')
  })

  it('respects locale — same builder yields the en signature when given en strings', () => {
    const out = buildMilestoneShareText({ kind: 'album', pct: 100 }, t(I18N_EN))
    expect(out.endsWith(`\n\n${I18N_EN['share.signature']}`)).toBe(true)
  })
})
