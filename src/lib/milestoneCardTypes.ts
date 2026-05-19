import type { ShareFlow } from './brand/shareFooter'

export type MilestoneCardCopy = {
  tagline: string
  teamHeadline: string
  albumHeadline: (pct: number) => string
  albumSubline: (pct: number) => string
  t: (key: string) => string
}

export type TeamMilestoneDraw = {
  kind: 'team'
  teamCode: string
  flag: string
  name: string
  copy: MilestoneCardCopy
}

export type AlbumMilestoneDraw = {
  kind: 'album'
  pct: 25 | 50 | 75 | 100
  copy: MilestoneCardCopy
}

export type MilestoneDrawInput = (TeamMilestoneDraw | AlbumMilestoneDraw) & {
  flow?: ShareFlow
}
