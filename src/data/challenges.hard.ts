import type { Challenge } from './challenges.types'

export const CHALLENGES_HARD: Challenge[] = [
  {
    id: 'complete-brazil',
    icon: '🇧🇷',
    difficulty: 'hard',
    teamCode: 'BRA',
    requiredQty: 'all',
  },
  {
    id: 'complete-group-a',
    icon: '📋',
    difficulty: 'hard',
    groupLetter: 'A',
    requiredQty: 'all',
  },
  {
    id: 'halfway',
    icon: '🎯',
    difficulty: 'hard',
    albumTotal: true,
    requiredQty: 497,
  },
]
