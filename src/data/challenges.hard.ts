import type { Challenge } from './challenges.types'

export const CHALLENGES_HARD: Challenge[] = [
  {
    id: 'complete-brazil',
    icon: '🇧🇷',
    title: 'Seleção Completa',
    description: 'Complete 100% das figurinhas do Brasil.',
    difficulty: 'hard',
    teamCode: 'BRA',
    requiredQty: 'all',
  },
  {
    id: 'complete-group-a',
    icon: '📋',
    title: 'Grupo A Completo',
    description: 'Cole todas as figurinhas dos quatro times do Grupo A.',
    difficulty: 'hard',
    groupLetter: 'A',
    requiredQty: 'all',
  },
  {
    id: 'halfway',
    icon: '🎯',
    title: 'Meio Álbum',
    description: 'Cole 497 figurinhas — metade do álbum completo.',
    difficulty: 'hard',
    albumTotal: true,
    requiredQty: 497,
  },
]
