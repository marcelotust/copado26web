import { describe, expect, it } from 'vitest'
import { drawMilestoneCard } from './milestoneCardCanvas'
import type {
  FoilMilestoneDraw,
  GenericMilestoneDraw,
  PctMilestoneDraw,
  TeamCompleteMilestoneDraw,
} from './milestoneCardTypes'

type Call = { fn: string; args: unknown[] }

/** Recording 2d context — captures the sequence of calls for snapshot-style assertions. */
function recordingCtx(): { ctx: CanvasRenderingContext2D; calls: Call[]; texts: string[] } {
  const calls: Call[] = []
  const texts: string[] = []
  const record = (fn: string) => (...args: unknown[]) => {
    calls.push({ fn, args })
    if (fn === 'fillText') texts.push(String(args[0]))
    if (fn === 'createLinearGradient' || fn === 'createRadialGradient') {
      return {
        addColorStop: (...stopArgs: unknown[]) =>
          calls.push({ fn: 'gradient.addColorStop', args: stopArgs }),
      }
    }
    if (fn === 'measureText') return { width: String(args[0]).length * 12 }
    return undefined
  }
  const handler: ProxyHandler<CanvasRenderingContext2D> = {
    get(target, key: string) {
      if (key in target) return (target as unknown as Record<string, unknown>)[key]
      return record(key)
    },
    set(target, key: string, value) {
      ;(target as unknown as Record<string, unknown>)[key] = value
      calls.push({ fn: `set:${key}`, args: [value] })
      return true
    },
  }
  const ctx = new Proxy({} as CanvasRenderingContext2D, handler)
  return { ctx, calls, texts }
}

const copy = { tagline: 'Copa do Mundo FIFA 2026', t: (k: string) => `t:${k}` }

describe('drawMilestoneCard — variants', () => {
  it('renders pct variant with header, % big number, headline, subline, footer', () => {
    const input: PctMilestoneDraw = {
      variant: 'pct',
      pct: 50,
      headline: '50% do álbum!',
      subline: 'Continue colando!',
      copy,
    }
    const { ctx, texts } = recordingCtx()
    drawMilestoneCard(ctx, input)

    expect(texts).toContain('26')
    expect(texts).toContain('Meu Álbum 2026')
    expect(texts).toContain('50%')
    expect(texts).toContain('50% do álbum!')
    expect(texts).toContain('Continue colando!')
    expect(texts).toContain('t:share.scanCta')
  })

  it('renders team-complete variant with flag, team name, slot labels, footer', () => {
    const input: TeamCompleteMilestoneDraw = {
      variant: 'team-complete',
      teamCode: 'BRA',
      flag: '🇧🇷',
      name: 'Brasil',
      headline: 'Time completo! 🎉',
      copy,
    }
    const { ctx, texts } = recordingCtx()
    drawMilestoneCard(ctx, input)

    expect(texts).toContain('🇧🇷')
    expect(texts).toContain('Brasil')
    expect(texts).toContain('Time completo! 🎉')
    expect(texts).toContain('BRA 01')
    expect(texts).toContain('BRA 05')
    // 20-badge marks the full team set (5 visible in the fan + badge for the total)
    expect(texts).toContain('20')
    expect(texts).toContain('★')
    expect(texts).toContain('Meu Álbum 2026')
  })

  it('renders foil variant with sticker code label, flag+name, headline, halo footer', () => {
    const input: FoilMilestoneDraw = {
      variant: 'foil',
      teamCode: 'FWC',
      flag: '🏆',
      stickerNumber: 7,
      stickerName: 'Trofeu',
      headline: 'Foil épica!',
      subline: 'Raridade desbloqueada',
      copy,
    }
    const { ctx, texts } = recordingCtx()
    drawMilestoneCard(ctx, input)

    expect(texts).toContain('FWC 07')
    expect(texts).toContain('🏆 Trofeu')
    expect(texts).toContain('Foil épica!')
    expect(texts).toContain('Raridade desbloqueada')
  })

  it('renders generic variant with star, eyebrow, hero, sub, subtitle', () => {
    const input: GenericMilestoneDraw = {
      variant: 'generic',
      eyebrow: 'Marco especial',
      hero: 'Algo novo aconteceu',
      sub: 'Continue jogando',
      subtitle: 'Detalhes na home',
      copy,
    }
    const { ctx, texts } = recordingCtx()
    drawMilestoneCard(ctx, input)

    expect(texts).toContain('★')
    expect(texts).toContain('MARCO ESPECIAL')
    expect(texts).toContain('Algo novo aconteceu')
    expect(texts).toContain('Continue jogando')
    expect(texts).toContain('Detalhes na home')
  })

  it('every variant draws the shared header (selo "26" + brand) and footer (brand + URL)', () => {
    const variants = [
      {
        variant: 'pct',
        pct: 25,
        headline: 'a',
        subline: 'b',
        copy,
      } as PctMilestoneDraw,
      {
        variant: 'team-complete',
        teamCode: 'BRA',
        flag: '🇧🇷',
        name: 'Brasil',
        headline: 'c',
        copy,
      } as TeamCompleteMilestoneDraw,
      {
        variant: 'foil',
        teamCode: 'FWC',
        flag: '🏆',
        stickerNumber: 1,
        stickerName: 'd',
        headline: 'e',
        subline: 'f',
        copy,
      } as FoilMilestoneDraw,
      {
        variant: 'generic',
        eyebrow: 'g',
        hero: 'h',
        copy,
      } as GenericMilestoneDraw,
    ]
    for (const input of variants) {
      const { ctx, texts } = recordingCtx()
      drawMilestoneCard(ctx, input)
      expect(texts, `${input.variant} header selo`).toContain('26')
      expect(texts, `${input.variant} header brand`).toContain('Meu Álbum 2026')
      expect(texts, `${input.variant} footer url`).toContain('meualbum2026.app')
    }
  })
})
