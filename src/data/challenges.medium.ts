import type { Challenge } from './challenges.types'

export const CHALLENGES_MEDIUM: Challenge[] = [
  {
    id: 'south-america',
    icon: '🌎',
    difficulty: 'medium',
    confs: ['CONMEBOL'],
    requiredQty: 1,
    perTeam: true,
  },
  {
    id: 'europe-big5',
    icon: '🌍',
    difficulty: 'medium',
    teamCodes: ['ENG', 'FRA', 'GER', 'ESP', 'POR'],
    requiredQty: 1,
    perTeam: true,
  },
  {
    id: 'asia-rising',
    icon: '🌏',
    difficulty: 'medium',
    teamCodes: ['JPN', 'KOR', 'IRN', 'QAT'],
    requiredQty: 1,
    perTeam: true,
  },
  {
    id: 'africa-united',
    icon: '🦁',
    difficulty: 'medium',
    confs: ['CAF'],
    requiredQty: 1,
    perTeam: true,
  },
  {
    id: 'last-champion',
    icon: '🏆',
    difficulty: 'medium',
    teamCode: 'ARG',
    requiredQty: 5,
  },
  {
    id: 'fwc-history',
    icon: '📖',
    difficulty: 'medium',
    teamCode: 'FWC',
    requiredQty: 'all',
  },
  {
    id: 'five-continents',
    icon: '🌐',
    difficulty: 'medium',
    confGroups: [
      ['CONMEBOL', 'CONCACAF'],
      ['UEFA'],
      ['CAF'],
      ['AFC'],
      ['OFC'],
    ],
    requiredQty: 1,
  },
]
