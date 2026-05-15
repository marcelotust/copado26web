export type LandingFeature = {
  id: string
  icon: string
  accent: string
  tier: 1 | 2
}

export const LANDING_FEATURES: LandingFeature[] = [
  { id: 'mark-fast', icon: '⚡', accent: '#3b82f6', tier: 1 },
  { id: 'whatsapp-share', icon: '📤', accent: '#10b981', tier: 1 },
  { id: 'paste-trades', icon: '🔄', accent: '#f43f5e', tier: 1 },
  { id: 'dashboard', icon: '📊', accent: '#f59e0b', tier: 2 },
  { id: 'challenges', icon: '🏆', accent: '#f59e0b', tier: 2 },
  { id: 'milestones', icon: '🎉', accent: '#a855f7', tier: 2 },
]

export const LANDING_PRIVACY = [
  { id: 'encryption', icon: '🔒' },
  { id: 'analytics', icon: '📊' },
  { id: 'delete-account', icon: '🗑️' },
  { id: 'lgpd', icon: '🇧🇷' },
] as const

export const LANDING_STATS = [
  { id: 'stickers', value: '994' },
  { id: 'teams', value: '48' },
  { id: 'groups', value: '12' },
  { id: 'hosts', value: '3' },
] as const
