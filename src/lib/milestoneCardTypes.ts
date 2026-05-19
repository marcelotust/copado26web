/**
 * Milestone share card variants — see handoff seção 06.
 *
 * - `pct`           — album progress (25/50/75/100 %), grid of mini-sticker slots
 * - `team-complete` — full national-team milestone, 12 mini-sticker slots
 * - `foil`          — rare/foil sticker spotlight with halo
 * - `generic`       — fallback layout with eyebrow/hero/sub/subtitle text slots
 */
export type MilestoneCardVariant = 'pct' | 'team-complete' | 'foil' | 'generic'

import type { CardBackground } from './brand/cardBackgrounds'

export type MilestoneCardCommonCopy = {
  /** Small flavor line, e.g. "Copa do Mundo FIFA 2026". */
  tagline: string
  t: (key: string) => string
}

type WithBackground = { background?: CardBackground }

export type PctMilestoneDraw = WithBackground & {
  variant: 'pct'
  pct: 25 | 50 | 75 | 100
  /** Optional grid slot data (owned/unowned). Defaults to 20 placeholder slots, filled proportionally to pct. */
  slots?: ReadonlyArray<{ owned: boolean }>
  headline: string
  subline: string
  copy: MilestoneCardCommonCopy
}

export type TeamCompleteMilestoneDraw = WithBackground & {
  variant: 'team-complete'
  teamCode: string
  flag: string
  name: string
  /** Optional 12 slot labels for mini-stickers (defaults to numbered 01..12). */
  slotLabels?: ReadonlyArray<string>
  headline: string
  copy: MilestoneCardCommonCopy
}

export type FoilMilestoneDraw = WithBackground & {
  variant: 'foil'
  teamCode: string
  flag: string
  stickerNumber: number
  stickerName: string
  headline: string
  subline: string
  copy: MilestoneCardCommonCopy
}

export type GenericMilestoneDraw = WithBackground & {
  variant: 'generic'
  eyebrow: string
  hero: string
  sub?: string
  subtitle?: string
  copy: MilestoneCardCommonCopy
}

export type MilestoneDrawInput =
  | PctMilestoneDraw
  | TeamCompleteMilestoneDraw
  | FoilMilestoneDraw
  | GenericMilestoneDraw
