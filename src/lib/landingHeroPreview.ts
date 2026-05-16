/** Hero look — production defaults: mosaic + vignette. Dev overrides: `?heroBg=` / `?heroText=`. */

export type HeroBgVariant = 'a' | 'b' | 'c'
export type HeroTextVariant = 'legacy' | 'vignette' | 'card' | 'glow'

export type HeroPreviewConfig = {
  bg: HeroBgVariant
  text: HeroTextVariant
}

/** a = soft flag mosaic + sticker cards */
const BG_DEFAULT: HeroBgVariant = 'a'
/** vignette scrim behind copy + light subtitle shadow */
const TEXT_DEFAULT: HeroTextVariant = 'vignette'

function parseBg(raw: string | null): HeroBgVariant {
  if (raw === 'a' || raw === 'b' || raw === 'c') return raw
  return BG_DEFAULT
}

function parseText(raw: string | null): HeroTextVariant {
  if (raw === 'legacy' || raw === 'vignette' || raw === 'card' || raw === 'glow') return raw
  return TEXT_DEFAULT
}

export function readHeroPreviewConfig(): HeroPreviewConfig {
  if (!import.meta.env.DEV) {
    return { bg: BG_DEFAULT, text: TEXT_DEFAULT }
  }
  const params = new URLSearchParams(window.location.search)
  return {
    bg: parseBg(params.get('heroBg')),
    text: parseText(params.get('heroText')),
  }
}

export const HERO_PREVIEW_HINT =
  '?heroBg=a|b|c · ?heroText=legacy|vignette|card|glow · ?hero=control|treatment'
