import { CHALLENGES_EASY } from './challenges.easy'
import { CHALLENGES_HARD } from './challenges.hard'
import { CHALLENGES_MEDIUM } from './challenges.medium'
import type { Challenge, ChallengeDifficulty } from './challenges.types'

export type { Challenge, ChallengeDifficulty }

export const CHALLENGES: Challenge[] = [
  ...CHALLENGES_EASY,
  ...CHALLENGES_MEDIUM,
  ...CHALLENGES_HARD,
]
