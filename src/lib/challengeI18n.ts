import type { Challenge } from '../data/challenges'

export function challengeTitle(challenge: Pick<Challenge, 'id'>, t: (key: string) => string): string {
  return t(`challenges.items.${challenge.id}.title`)
}

export function challengeDescription(challenge: Pick<Challenge, 'id'>, t: (key: string) => string): string {
  return t(`challenges.items.${challenge.id}.description`)
}
