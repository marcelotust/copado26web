import type { CSSProperties } from 'react'
import type { HeroTextVariant } from '../../lib/landingHeroPreview'

export function heroTitleClass(text: HeroTextVariant): string {
  const base = 'text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight'
  if (text === 'glow') {
    return `${base} drop-shadow-[0_2px_28px_rgba(2,6,23,0.95)]`
  }
  return base
}

export function heroHighlightClass(text: HeroTextVariant): string {
  const base = 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-rose-400 to-emerald-400'
  if (text === 'glow') {
    return `${base} drop-shadow-[0_0_32px_rgba(59,130,246,0.35)]`
  }
  return base
}

const READABLE_SHADOW =
  '0 1px 10px rgba(2,6,23,1), 0 2px 24px rgba(2,6,23,0.95), 0 0 36px rgba(2,6,23,0.65)'

const SUBTITLE_SHADOW = '0 1px 6px rgba(2,6,23,0.55), 0 2px 14px rgba(2,6,23,0.35)'

export function heroSubtitleClass(text: HeroTextVariant): string {
  const base = 'text-base sm:text-lg leading-relaxed max-w-md'
  return text === 'card' ? `${base} text-slate-200` : `${base} text-slate-300`
}

export function heroSubtitleStyle(text: HeroTextVariant): CSSProperties | undefined {
  if (text === 'card') return undefined
  return { textShadow: SUBTITLE_SHADOW }
}

export function heroFinePrintClass(text: HeroTextVariant): string {
  const base = 'text-xs'
  switch (text) {
    case 'card':
      return `${base} text-slate-400`
    case 'glow':
    case 'vignette':
      return `${base} text-slate-300`
    default:
      return `${base} text-slate-500`
  }
}

export function heroFinePrintStyle(text: HeroTextVariant): CSSProperties | undefined {
  if (text === 'vignette' || text === 'glow') {
    return { textShadow: READABLE_SHADOW }
  }
  return undefined
}

export function heroSecondaryLinkClass(text: HeroTextVariant): string {
  const base = 'text-xs underline underline-offset-4 transition-colors'
  switch (text) {
    case 'card':
      return `${base} text-slate-300 hover:text-white`
    case 'glow':
    case 'vignette':
      return `${base} text-slate-200 hover:text-white font-medium`
    default:
      return `${base} text-slate-500 hover:text-slate-300`
  }
}

export function heroSecondaryLinkStyle(text: HeroTextVariant): CSSProperties | undefined {
  if (text === 'vignette' || text === 'glow') {
    return { textShadow: READABLE_SHADOW }
  }
  return undefined
}
