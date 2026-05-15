import type { Challenge } from './challenges.types'

export const CHALLENGES_EASY: Challenge[] = [
  {
    id: 'kickoff',
    icon: '⚽',
    title: 'Primeiros Passos',
    description: 'Cole 10 figurinhas, quaisquer que sejam.',
    difficulty: 'easy',
    albumTotal: true,
    requiredQty: 10,
  },
  {
    id: 'host-trio',
    icon: '🏟️',
    title: 'Países Sede',
    description: 'Cole ao menos 1 figurinha de cada país-sede: EUA, México e Canadá.',
    difficulty: 'easy',
    teamCodes: ['USA', 'MEX', 'CAN'],
    requiredQty: 1,
    perTeam: true,
  },
  {
    id: 'group-a-taste',
    icon: '📋',
    title: 'Grupo A',
    description: 'Tenha ao menos 1 figurinha de cada time do Grupo A.',
    difficulty: 'easy',
    groupLetter: 'A',
    requiredQty: 1,
    perTeam: true,
  },
  {
    id: 'oceania',
    icon: '🌊',
    title: 'Oceania',
    description: 'Cole ao menos 1 figurinha da Nova Zelândia e da Austrália.',
    difficulty: 'easy',
    teamCodes: ['NZL', 'AUS'],
    requiredQty: 1,
    perTeam: true,
  },
]
