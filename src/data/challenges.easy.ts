import type { Challenge } from './challenges.types'

export const CHALLENGES_EASY: Challenge[] = [
  {
    id: 'kickoff',
    icon: '⚽',
    difficulty: 'easy',
    albumTotal: true,
    requiredQty: 10,
  },
  {
    id: 'host-trio',
    icon: '🏟️',
    difficulty: 'easy',
    teamCodes: ['USA', 'MEX', 'CAN'],
    requiredQty: 1,
    perTeam: true,
  },
  {
    id: 'group-a-taste',
    icon: '📋',
    difficulty: 'easy',
    groupLetter: 'A',
    requiredQty: 1,
    perTeam: true,
  },
  {
    id: 'oceania',
    icon: '🌊',
    difficulty: 'easy',
    teamCodes: ['NZL', 'AUS'],
    requiredQty: 1,
    perTeam: true,
  },
]
