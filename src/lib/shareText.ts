import type { MissingGroup, SwapGroup } from '../state/stickersTypes'

export function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function getPublicAppUrl(): string {
  const v = import.meta.env.VITE_APP_URL as string | undefined
  if (typeof v === 'string') {
    const trimmed = v.trim()
    if (trimmed) return trimmed.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}

export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ''))
}

export type ShareFooterContent = {
  appName: string
  cta: string
  url: string | null
}

/** Same strings used in shared messages (app name, URL, CTA). */
export function getShareFooterContent(t: (key: string) => string): ShareFooterContent {
  const urlRaw = getPublicAppUrl()
  return {
    appName: t('share.appName'),
    cta: t('share.cta'),
    url: urlRaw || null,
  }
}

/** The "— / appName / url / cta" block, one line each, no extra surrounding newlines. */
export function buildSharePromoBlock(t: (key: string) => string): string {
  const { appName, cta, url } = getShareFooterContent(t)
  const lines = ['—', appName]
  if (url) lines.push(url)
  lines.push(cta)
  return lines.join('\n')
}

/** Promo block with leading blank lines (after list / end of message). */
export function buildShareFooter(t: (key: string) => string): string {
  return `\n\n${buildSharePromoBlock(t)}`
}

/** Same promo block after the headline, before the sticker list. */
export function buildSharePromoAfterHeadline(t: (key: string) => string): string {
  return `\n\n${buildSharePromoBlock(t)}\n\n`
}

export function buildMissingShareBody(
  groups: MissingGroup[],
  teamName: (code: string) => string,
  teamFlag: (code: string) => string,
): string {
  const lines = groups.flatMap(({ teamCode, numbers }) => [
    `${teamFlag(teamCode)} ${teamName(teamCode)} (${numbers.length})`,
    numbers.map(n => `${teamCode} ${pad(n)}`).join(' · '),
    '',
  ])
  return lines.join('\n').trim()
}

export function buildMissingShareText(
  groups: MissingGroup[],
  teamName: (code: string) => string,
  teamFlag: (code: string) => string,
  total: number,
  t: (key: string) => string,
): string {
  const headline = interpolate(t('share.missingHeadline'), { count: total })
  const body = buildMissingShareBody(groups, teamName, teamFlag)
  return `${headline}${buildSharePromoAfterHeadline(t)}${body}${buildShareFooter(t)}`
}

export function buildSwapsShareBody(
  groups: SwapGroup[],
  teamName: (code: string) => string,
  teamFlag: (code: string) => string,
): string {
  const lines = groups.flatMap(({ teamCode, stickers }) => {
    const teamExtras = stickers.reduce((acc, s) => acc + (s.quantity - 1), 0)
    const codes = stickers.map((s) => {
      const extra = s.quantity - 1
      return `${teamCode} ${pad(s.number)}${extra > 1 ? ` ×${extra}` : ''}`
    })
    return [
      `${teamFlag(teamCode)} ${teamName(teamCode)} (${teamExtras})`,
      codes.join(' · '),
      '',
    ]
  })
  return lines.join('\n').trim()
}

export function buildSwapsShareText(
  groups: SwapGroup[],
  teamName: (code: string) => string,
  teamFlag: (code: string) => string,
  totalExtras: number,
  t: (key: string) => string,
): string {
  const headline = interpolate(t('share.swapsHeadline'), { count: totalExtras })
  const body = buildSwapsShareBody(groups, teamName, teamFlag)
  return `${headline}${buildSharePromoAfterHeadline(t)}${body}${buildShareFooter(t)}`
}
