import type { Challenge } from '../data/challenges'
import type { MissingGroup, SwapGroup } from '../state/stickersTypes'
import { getShareSignature } from './brand/shareFooter'
import { challengeTitle } from './challengeI18n'
import { displayTeamCode } from './stickerDisplay'

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

export function buildShareText(body: string, t: (key: string) => string): string {
  return body + getShareSignature(t)
}

export function buildMissingShareBody(
  groups: MissingGroup[],
  teamName: (code: string) => string,
  teamFlag: (code: string) => string,
): string {
  const lines = groups.flatMap(({ teamCode, numbers }) => [
    `${teamFlag(teamCode)} ${teamName(teamCode)} (${numbers.length})`,
    numbers.map(n => `${displayTeamCode(teamCode)} ${pad(n)}`).join(' · '),
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
  return buildShareText(`${headline}\n\n${body}`, t)
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
      return `${displayTeamCode(teamCode)} ${pad(s.number)}${extra > 1 ? ` ×${extra}` : ''}`
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
  return buildShareText(`${headline}\n\n${body}`, t)
}

export function buildChallengeShareText(
  challenge: Challenge,
  t: (key: string) => string,
): string {
  const body = interpolate(t('challenges.shareText'), {
    title: challengeTitle(challenge, t),
  })
  return buildShareText(body, t)
}

export type MilestoneShareInput =
  | { kind: 'album'; pct: number }
  | { kind: 'team'; teamCode: string; flag: string; name: string }

export function buildMilestoneShareText(
  milestone: MilestoneShareInput,
  t: (key: string) => string,
): string {
  const body =
    milestone.kind === 'album'
      ? interpolate(t('milestone.albumHeadline'), { pct: milestone.pct })
      : `${milestone.flag} ${milestone.name} — ${t('milestone.teamHeadline')}`
  return buildShareText(body, t)
}
