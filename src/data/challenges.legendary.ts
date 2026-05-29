import type { Challenge } from './challenges.types'

export const CHALLENGES_LEGENDARY: Challenge[] = [
  {
    id: 'all-foil',
    icon: '✨',
    difficulty: 'legendary',
    targetIds: [
      'WAP-00', 'WAP-01', 'WAP-02', 'WAP-03', 'WAP-04', 'WAP-05', 'WAP-06', 'WAP-07', 'WAP-08',
      'MEX-01', 'MEX-13', 'RSA-01', 'RSA-13', 'KOR-01', 'KOR-13', 'CZE-01', 'CZE-13',
      'CAN-01', 'CAN-13', 'BIH-01', 'BIH-13', 'QAT-01', 'QAT-13', 'SUI-01', 'SUI-13',
      'BRA-01', 'BRA-13', 'MAR-01', 'MAR-13', 'HAI-01', 'HAI-13', 'SCO-01', 'SCO-13',
      'USA-01', 'USA-13', 'PAR-01', 'PAR-13', 'AUS-01', 'AUS-13', 'TUR-01', 'TUR-13',
      'GER-01', 'GER-13', 'CUW-01', 'CUW-13', 'CIV-01', 'CIV-13', 'ECU-01', 'ECU-13',
      'NED-01', 'NED-13', 'JPN-01', 'JPN-13', 'SWE-01', 'SWE-13', 'TUN-01', 'TUN-13',
      'BEL-01', 'BEL-13', 'EGY-01', 'EGY-13', 'IRN-01', 'IRN-13', 'NZL-01', 'NZL-13',
      'ESP-01', 'ESP-13', 'CPV-01', 'CPV-13', 'KSA-01', 'KSA-13', 'URU-01', 'URU-13',
      'FRA-01', 'FRA-13', 'SEN-01', 'SEN-13', 'IRQ-01', 'IRQ-13', 'NOR-01', 'NOR-13',
      'ARG-01', 'ARG-13', 'ALG-01', 'ALG-13', 'AUT-01', 'AUT-13', 'JOR-01', 'JOR-13',
      'POR-01', 'POR-13', 'COD-01', 'COD-13', 'UZB-01', 'UZB-13', 'COL-01', 'COL-13',
      'ENG-01', 'ENG-13', 'CRO-01', 'CRO-13', 'GHA-01', 'GHA-13', 'PAN-01', 'PAN-13',
      'FWC-09', 'FWC-10', 'FWC-11', 'FWC-12', 'FWC-13', 'FWC-14', 'FWC-15', 'FWC-16', 'FWC-17', 'FWC-18', 'FWC-19',
      'CC-01', 'CC-02', 'CC-03', 'CC-04', 'CC-05', 'CC-06', 'CC-07', 'CC-08', 'CC-09', 'CC-10', 'CC-11', 'CC-12', 'CC-13', 'CC-14',
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
