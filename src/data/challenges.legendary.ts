import type { Challenge } from './challenges.types'

export const CHALLENGES_LEGENDARY: Challenge[] = [
  {
    id: 'all-foil',
    icon: '✨',
    difficulty: 'legendary',
    targetIds: [
      'WAP-00', 'WAP-01', 'WAP-02', 'WAP-03', 'WAP-04', 'WAP-05', 'WAP-06', 'WAP-07', 'WAP-08',
      'MEX-01', 'RSA-01', 'KOR-01', 'CZE-01',
      'CAN-01', 'BIH-01', 'QAT-01', 'SUI-01',
      'BRA-01', 'MAR-01', 'HAI-01', 'SCO-01',
      'USA-01', 'PAR-01', 'AUS-01', 'TUR-01',
      'GER-01', 'CUW-01', 'CIV-01', 'ECU-01',
      'NED-01', 'JPN-01', 'SWE-01', 'TUN-01',
      'BEL-01', 'EGY-01', 'IRN-01', 'NZL-01',
      'ESP-01', 'CPV-01', 'KSA-01', 'URU-01',
      'FRA-01', 'SEN-01', 'IRQ-01', 'NOR-01',
      'ARG-01', 'ALG-01', 'AUT-01', 'JOR-01',
      'POR-01', 'COD-01', 'UZB-01', 'COL-01',
      'ENG-01', 'CRO-01', 'GHA-01', 'PAN-01',
      'FWC-09', 'FWC-10', 'FWC-11', 'FWC-12', 'FWC-13', 'FWC-14', 'FWC-15', 'FWC-16', 'FWC-17', 'FWC-18', 'FWC-19',
    ],
    requiredQty: 'all',
  },
  {
    id: 'all-champions',
    icon: '👑',
    difficulty: 'legendary',
    teamCodes: ['BRA', 'GER', 'ARG', 'FRA', 'URU', 'ENG', 'ESP'],
    requiredQty: 'all',
    perTeam: true,
  },
  {
    id: 'full-album',
    icon: '🏆',
    difficulty: 'legendary',
    albumTotal: true,
    requiredQty: 994,
  },
]
