export type ChallengeDifficulty = 'easy' | 'medium' | 'hard'

export type Challenge = {
  id: string
  icon: string
  title: string
  description: string
  difficulty: ChallengeDifficulty
  // --- target resolution (pick exactly one) ---
  /** Counts collected stickers across the entire album */
  albumTotal?: true
  /** All stickers from one team */
  teamCode?: string
  /** All stickers from all teams in a group (uses Team.group_letter) */
  groupLetter?: string
  /** Explicit list of sticker IDs */
  targetIds?: string[]
  /** All teams whose conf is in this list — combined with perTeam */
  confs?: string[]
  /** Each inner array = one "continent slot"; user needs ≥1 sticker from ≥1 team in each slot */
  confGroups?: string[][]
  // --- completion condition ---
  requiredQty: number | 'all'
  /** When true, requiredQty must be satisfied per team individually (owned = # of qualifying teams) */
  perTeam?: boolean
}

export const CHALLENGES: Challenge[] = [
  // ── Easy ─────────────────────────────────────────────────────────────────
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
    targetIds: ['USA-01', 'MEX-01', 'CAN-01'],
    requiredQty: 3,
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
    targetIds: ['NZL-01', 'AUS-01'],
    requiredQty: 2,
  },

  // ── Medium ───────────────────────────────────────────────────────────────
  {
    id: 'south-america',
    icon: '🌎',
    title: 'América do Sul',
    description: 'Tenha ao menos 1 figurinha de cada seleção sul-americana (CONMEBOL).',
    difficulty: 'medium',
    confs: ['CONMEBOL'],
    requiredQty: 1,
    perTeam: true,
  },
  {
    id: 'europe-big5',
    icon: '🌍',
    title: 'Gigantes da Europa',
    description: 'Cole ao menos 1 figurinha de Inglaterra, França, Alemanha, Espanha e Portugal.',
    difficulty: 'medium',
    targetIds: ['ENG-01', 'FRA-01', 'GER-01', 'ESP-01', 'POR-01'],
    requiredQty: 5,
  },
  {
    id: 'asia-rising',
    icon: '🌏',
    title: 'Ásia em Alta',
    description: 'Cole ao menos 1 figurinha do Japão, Coreia do Sul, Irã e Catar.',
    difficulty: 'medium',
    targetIds: ['JPN-01', 'KOR-01', 'IRN-01', 'QAT-01'],
    requiredQty: 4,
  },
  {
    id: 'africa-united',
    icon: '🦁',
    title: 'África Unida',
    description: 'Tenha ao menos 1 figurinha de cada seleção africana (CAF).',
    difficulty: 'medium',
    confs: ['CAF'],
    requiredQty: 1,
    perTeam: true,
  },
  {
    id: 'last-champion',
    icon: '🏆',
    title: 'O Campeão',
    description: 'Cole ao menos 5 figurinhas da Argentina, atual campeã do mundo.',
    difficulty: 'medium',
    teamCode: 'ARG',
    requiredQty: 5,
  },
  {
    id: 'fwc-history',
    icon: '📖',
    title: 'História da Copa',
    description: 'Cole todos os cromos da seção histórica da Copa do Mundo (FWC 09–19).',
    difficulty: 'medium',
    targetIds: [
      'FWC-09', 'FWC-10', 'FWC-11', 'FWC-12', 'FWC-13',
      'FWC-14', 'FWC-15', 'FWC-16', 'FWC-17', 'FWC-18', 'FWC-19',
    ],
    requiredQty: 11,
  },
  {
    id: 'five-continents',
    icon: '🌐',
    title: 'Pelos 5 Cantos do Mundo',
    description: 'Tenha ao menos 1 figurinha de 1 time em cada continente.',
    difficulty: 'medium',
    // Américas = CONMEBOL ∪ CONCACAF; demais continentes em array unitário
    confGroups: [
      ['CONMEBOL', 'CONCACAF'],
      ['UEFA'],
      ['CAF'],
      ['AFC'],
      ['OFC'],
    ],
    requiredQty: 1,
  },

  // ── Hard ─────────────────────────────────────────────────────────────────
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
